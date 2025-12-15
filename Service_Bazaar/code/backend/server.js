require('dotenv').config();
const express     = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors        = require('cors');

const bodyParser  = require('body-parser');
const crypto      = require('crypto');
const nodemailer  = require('nodemailer');
const os          = require('os');
const bcrypt      = require('bcrypt');
const admin       = require('firebase-admin');
const fs = require('fs');

const app  = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const fetch = require('node-fetch'); 


/* SENSITIVES -------------- */
const geminiApiKey = process.env.GEMINI_API_KEY;
const adminPackage = process.env.ADMIN_PACKAGE;
const mailCode = process.env.MAIL_CODE;
const mailID = process.env.MAIL_ID;

const serviceAccount = require(`./${adminPackage}`);  // Firebase Admin Init
/* SENSITIVES ---------------*/

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db              = admin.firestore();
const userCollection   = db.collection('User Data');          // <- Firestore collection

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailID,   
    pass: mailCode,       
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Chat-related events
  socket.on('join-chat', ({ bookingId }) => {
    if (bookingId) {
      socket.join(bookingId);
      console.log(`Client ${socket.id} joined chat room ${bookingId}`);
    }
  });

  socket.on('leave-chat', ({ bookingId }) => {
    if (bookingId) {
      socket.leave(bookingId);
      console.log(`Client ${socket.id} left chat room ${bookingId}`);
    }
  });
});


const otpStore = {}; 

// Utility: local IP for pretty console output
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

app.get('/services', async (req, res) => {
  try {
    const snapshot = await db.collection('Service Info').get();
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

app.get('/providers/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  const { lat, lng, radius = 5 } = req.query;

  try {
    /*  grab all providers for that service */
    const snap = await db
      .collection('Provider Info')
      .where('serviceId', '==', serviceId)
      .get();

    let providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /*  if coordinates provided ⇒ distance‑filter */
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxKm = parseFloat(radius);

      const haversine = (la1, lo1, la2, lo2) => {
        const R = 6371;
        const dL = ((la2 - la1) * Math.PI) / 180;
        const dO = ((lo2 - lo1) * Math.PI) / 180;
        const a =
          Math.sin(dL / 2) ** 2 +
          Math.cos((la1 * Math.PI) / 180) *
            Math.cos((la2 * Math.PI) / 180) *
            Math.sin(dO / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
      };

      providers = providers.filter(p => {
        const providerLat = p.location?.lat || p.lat;
        const providerLng = p.location?.lng || p.lng;
        
        if (typeof providerLat !== 'number' || typeof providerLng !== 'number') {
          console.log(' Invalid coordinates for provider:', p.id, providerLat, providerLng);
          return false;
        }
        
        const distance = haversine(userLat, userLng, providerLat, providerLng);
        return distance <= maxKm;
      });
    }

    providers.sort(
      (a, b) => (parseFloat(b.rating ?? 0) - parseFloat(a.rating ?? 0))
    );

    res.json(providers);
  } catch (err) {
    console.error('Error fetching providers:', err);
    res.status(500).json({ message: 'Error fetching providers' });
  }
});

app.get('/provider/:providerId', async (req, res) => {
  const { providerId } = req.params;

  try {
    const doc = await db.collection('Provider Info').doc(providerId).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Error fetching provider by ID:', err);
    res.status(500).json({ message: 'Error fetching provider' });
  }
});


app.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const otp        = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt  = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore[email]  = { otp, expiresAt, attempts: 0 };

  try {
    await transporter.sendMail({
      from: mailID,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});


app.post('/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data) return res.status(400).json({ success: false, message: 'OTP not requested' });
  if (Date.now() > data.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (data.attempts >= 5) {
    delete otpStore[email];
    return res.status(429).json({ success: false, message: 'Too many attempts' });
  }
  if (data.otp !== otp) {
    otpStore[email].attempts++;
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  res.json({ success: true });
});


app.post('/auth/set-password', async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  const data = otpStore[email];
  if (!data || data.otp !== otp || Date.now() > data.expiresAt)
    return res.status(400).json({ success: false, message: 'OTP invalid or expired' });

  // Does user exist?
  const doc = await userCollection.doc(email).get();
  if (doc.exists)
    return res.status(400).json({ success: false, message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const sessionId      = crypto.randomBytes(24).toString('hex');

  await userCollection.doc(email).set({
    email,
    hashedPassword,
    sessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    name: '',
    isProvider: false,
  });

  delete otpStore[email];
  res.json({ success: true, sessionId });
});


app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  const doc = await userCollection.doc(email).get();
  if (!doc.exists) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const user  = doc.data();
  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const sessionId = crypto.randomBytes(24).toString('hex');
  await userCollection.doc(email).update({ sessionId });

  res.json({ success: true, sessionId });
});

app.post('/calculate-cost', async (req, res) => {
  try {
    const { providerId, date, arrivalTime, duration, userLocation } = req.body;

    // Fetch provider and service data
    const providerDoc = await db.collection('Provider Info').doc(providerId).get();
    if (!providerDoc.exists) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const provider = providerDoc.data();

    let baseRate = 100;
    try {
      const serviceDoc = await db.collection('Service Info').doc(provider.serviceId).get();
      if (serviceDoc.exists) {
        const serviceData = serviceDoc.data();
        baseRate = serviceData.cost || serviceData.baseAmount || 100;
      }
    } catch (error) {
      console.error('Error fetching service info:', error);
    }

    // base cost
    let cost = baseRate * duration;

    // road distance and dynamic charges
    if (userLocation && provider.location) {
      try {
        const roadDistance = await getRoadDistance(
          userLocation.lat,
          userLocation.lng,
          provider.location.lat,
          provider.location.lng
        );
        
        if (roadDistance !== null) {
          // Dynamic distance pricing based on current cost
          // Charge 2% of current cost per 500m beyond 1km
          if (roadDistance > 1.0) {
            const extraDistance = roadDistance - 1.0; // Beyond 1km
            const extra500mBlocks = Math.ceil(extraDistance / 0.5); // Number of 500m blocks
            const distanceChargeRate = cost * 0.02; // 2% of current cost per 500m
            const totalDistanceCharge = extra500mBlocks * distanceChargeRate;
            
            cost += totalDistanceCharge;
          }
        }
      } catch (error) {
        console.error('Distance calculation failed:', error);
        cost += 50;
      }
    }

    // Experience premium
    if (provider.successfulServices > 100) {
      cost *= 1.2;
    } else if (provider.successfulServices > 50) {
      cost *= 1.1;
    }

    // Rating premium
    if (provider.rating >= 4.5) {
      cost *= 1.15;
    } else if (provider.rating >= 4.0) {
      cost *= 1.08;
    }

    // Time-based pricing
    const bookingDateTime = new Date(`${date}T${arrivalTime}`);
    const dayOfWeek = bookingDateTime.getDay();
    const hour = bookingDateTime.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cost *= 1.3;
    }

    if (hour >= 18 && hour < 22) {
      cost *= 1.25;
    }

    if (hour >= 22 || hour < 6) {
      cost *= 1.6;
    }

    // Duration discount
    if (duration > 4) {
      cost *= 0.9;
    }

    // Minimum cost
    cost = Math.max(200, Math.round(cost / 10) * 10);

    res.json({ 
      cost,
      breakdown: {
        baseCost: baseRate * duration,
        finalCost: cost
      }
    });

  } catch (error) {
    console.error('Cost calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
});

// Get actual road distance using OSRM (free)
async function getRoadDistance(lat1, lon1, lat2, lon2) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    );
    
    if (!response.ok) {
      throw new Error('OSRM API request failed');
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const distanceMeters = data.routes[0].distance;
      const distanceKm = distanceMeters / 1000;
      return Math.round(distanceKm * 10) / 10; // Round to 1 decimal
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('OSRM error:', error);
    return null;
  }
}
async function calculateBookingCost(bookingPayload) {
  const { providerId, date, arrivalTime, duration, location } = bookingPayload;

  // Fetch provider details
  const providerDoc = await db.collection('Provider Info').doc(providerId).get();
  if (!providerDoc.exists) {
    throw new Error('Provider not found');
  }
  const provider = providerDoc.data();

  // Fetch service base cost
  let baseRate = 100;
  try {
    const serviceDoc = await db.collection('Service Info').doc(provider.serviceId).get();
    if (serviceDoc.exists) {
      const serviceData = serviceDoc.data();
      baseRate = serviceData.cost || serviceData.baseAmount || 100;
    }
  } catch (error) {
    console.error('Error fetching service info:', error);
  }

  // Calculate base cost
  let cost = baseRate * duration;

  // Calculate road distance and dynamic charges
  if (location && provider.location) {
    try {
      const roadDistance = await getRoadDistance(
        location.lat,
        location.lng,
        provider.location.lat,
        provider.location.lng
      );
      
      if (roadDistance !== null && roadDistance > 1.0) {
        const extraDistance = roadDistance - 1.0;
        const extra500mBlocks = Math.ceil(extraDistance / 0.5);
        const distanceChargeRate = cost * 0.02; // 2% of current cost per 500m
        const totalDistanceCharge = extra500mBlocks * distanceChargeRate;
        cost += totalDistanceCharge;
      }
    } catch (error) {
      console.error('Distance calculation failed:', error);
      cost += 50; // Fallback charge
    }
  }

  // Experience premium
  if (provider.successfulServices > 100) {
    cost *= 1.2;
  } else if (provider.successfulServices > 50) {
    cost *= 1.1;
  }

  // Rating premium
  if (provider.rating >= 4.5) {
    cost *= 1.15;
  } else if (provider.rating >= 4.0) {
    cost *= 1.08;
  }

  // Time-based pricing
  const bookingDateTime = new Date(`${date}T${arrivalTime}`);
  const dayOfWeek = bookingDateTime.getDay();
  const hour = bookingDateTime.getHours();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    cost *= 1.3;
  }

  if (hour >= 18 && hour < 22) {
    cost *= 1.25;
  }

  if (hour >= 22 || hour < 6) {
    cost *= 1.6;
  }

  // Duration discount
  if (duration > 4) {
    cost *= 0.9;
  }

  // Minimum cost and rounding
  cost = Math.max(200, Math.round(cost / 10) * 10);
  
  return cost;
}

app.post('/book', async (req, res) => {
  try {
    const { sessionId, ...payload } = req.body;      
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID missing' });
    }
    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    if (!userData.name) {
      return res.status(400).json({ message: 'User name not set in profile' });
    }
    const username = userData.name;

    //   Calculate cost on server side                        
    const calculatedCost = await calculateBookingCost(payload);
    
    
    const bookingRef = db.collection('Service Data').doc();  
    const bookingId = bookingRef.id;
    const timestamp = new Date().toISOString();

    const record = {
      ...payload,                         
      providerId: payload.id ?? payload.providerId,
      userId,
      username,                          
      cost: calculatedCost,
      state: 'request sent',
      createdAt: timestamp,
    };

    await Promise.all([
      bookingRef.set(record),
      db.collection('Service Data (Private)').doc(bookingId).set(record),
      db.collection('Service Data (Public)').doc(bookingId).set(record),
      userDoc.ref.update({
        bookingIds: admin.firestore.FieldValue.arrayUnion(bookingId),
      }),
    ]);

    //   Respond to the client – return the bookingId for future use  
    return res.status(200).json({ message: 'Booking saved', bookingId });
  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/bookings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    /*  grab user doc  */
    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    if (userSnap.empty) return res.status(404).json([]);

    const userDoc = userSnap.docs[0];
    const bookingIds = userDoc.data().bookingIds || [];  
    if (!bookingIds.length) return res.status(200).json([]);

    /*  Firestore can fetch by ID using .doc(id)  */
    const docs = await Promise.all(
      bookingIds.map(id =>
        db.collection('Service Data (Private)').doc(id).get()
      )
    );

    /*  filter out missing or cancelled bookings  */
    const list = docs
      .filter(d => d.exists && d.data().state !== 'booking cancelled')
      .map(d => ({ id: d.id, ...d.data() }));

    return res.status(200).json(list);
  } catch (e) {
    console.error('Fetch bookings error:', e);
    res.status(500).json([]);
  }
});

app.get('/provider-availability/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    // Fetch all bookings for this provider first
    const bookingsSnap = await db.collection('Service Data (Private)')
      .where('providerId', '==', providerId)
      .get();

    if (bookingsSnap.empty) {
      return res.status(200).json([]);
    }

    // Filter out unapproved/completed bookings on the server side
    const availabilityData = [];
    bookingsSnap.forEach(doc => {
      const data = doc.data();
      
      // Skip unapproved or completed bookings
      if (['completed', 'request sent'].includes(data.state)) {
        return;
      }
      
      // Parse the booking date and time
      const startDateTime = new Date(`${data.date}T${data.arrivalTime}`);
      const durationHours = parseFloat(data.duration);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
      
      availabilityData.push({
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        duration: durationHours
      });
    });

    return res.status(200).json(availabilityData);
  } catch (e) {
    console.error('Fetch provider availability error:', e);
    res.status(500).json({ error: 'Failed to fetch provider availability data' });
  }
});

app.post('/unbook', async (req, res) => {
  try {
    const { sessionId, bookingId, reasons = [] } = req.body;
    if (!sessionId || !bookingId)
      return res.status(400).json({ message: 'sessionId and bookingId are required' });

    const userSnap = await db
      .collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    if (userSnap.empty)
      return res.status(404).json({ message: 'User not found' });
    const userDoc = userSnap.docs[0];

    const backendRef  = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await backendRef.get();
    if (!bookingSnap.exists)
      return res.status(404).json({ message: 'Booking not found' });

    const b = bookingSnap.data();

    if (b.state === 'booking cancelled' || b.state === 'completed')
      return res.status(400).json({ message: 'Invalid cancelation' });

    const now = Date.now();
    const startMs = Date.parse(`${b.date}T${b.arrivalTime}:00`);
    const durMin  = parseInt(b.duration || '1', 10) * 60;
    const quarterMs = startMs + durMin * 0.25 * 60_000;

    const cancelAllowed =
      ['request sent', 'approved','confirmed'].includes(b.state) ||
      (
        'double confirmed'==b.state &&
        now < quarterMs
      );

    if (!cancelAllowed)
      return res.status(400).json({ message: 'Cancellation window closed' });

    await backendRef.update({
      state: 'booking cancelled',
      unbookingReasons: reasons,
      cancelledAt: new Date().toISOString(),
    });

    await Promise.all([
      db.collection('Service Data (Private)').doc(bookingId).delete(),
      db.collection('Service Data (Public)').doc(bookingId).delete(),
    ]);

    await userDoc.ref.update({
      bookingIds: admin.firestore.FieldValue.arrayRemove(bookingId),
    });

    return res.status(200).json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error('Unbooking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/profile', async (req, res) => {
  try {
    const { sessionId, name, contact, image } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
    if (!name?.trim()) return res.status(400).json({ message: 'name required' });

    const snap = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const updateData = { name };
    
    if (contact?.trim()) {
      updateData.contact = contact;
    } else if (contact === '') {
      updateData.contact = '';
    }

    if (image?.trim()) {
      try {
        new URL(image);
        updateData.image = image;
      } catch {
        return res.status(400).json({ message: 'Invalid image URL' });
      }
    } else if (image === '') {
      updateData.image = '';
    }

    await snap.docs[0].ref.update(updateData);
    res.status(200).json({ message: 'Profile saved' });
  } catch (err) {
    console.error('Profile PUT error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/profile/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

    const snap = await db.collection('User Data').where('sessionId', '==', sessionId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const data = snap.docs[0].data();
    res.status(200).json({
      name: data.name || '',
      contact: data.contact || '',
      image: data.image || '', 
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
app.post('/apply-worker', async (req, res) => {
  try {
    const { sessionId, application } = req.body;
    if (!sessionId || !application)
      return res.status(400).json({ message: 'sessionId & application required' });

    const snap = await userCollection.where('sessionId', '==', sessionId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const userDoc = snap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    const existing = await db.collection('Provider Application')
      .where('userId', '==', userId).limit(1).get();
    if (!existing.empty)
      return res.status(409).json({ message: 'Application already submitted' });

    await db.collection('Provider Application').add({
      userId,
      image: userData.image || '', 
      ...application,          
      state: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await userDoc.ref.update({ isWorkerApplied: true });

    res.status(200).json({ message: 'Application submitted' });
  } catch (err) {
    console.error('Apply-worker error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// GET /user-by-session/:sessionId
app.get('/user-by-session/:sessionId', async (req, res) => {
  try {
    const snap = await db.collection('User Data')
      .where('sessionId', '==', req.params.sessionId)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({});

    const userDoc   = snap.docs[0];
    const userData  = userDoc.data();
    const pids      = userData.providerIds || [];

    const providerInfos = await Promise.all(
      pids.map(async pid => {
        const doc = await db.collection('Provider Info').doc(pid).get();
        return doc.exists
          ? { id: pid, service: doc.get('service') ?? 'Unnamed Service' }
          : null;
      })
    );

    res.json({
      id: userDoc.id,
      ...userData,
      providerIds: pids,
      providerInfos: providerInfos.filter(Boolean)  
    });
  } catch (err) {
    console.error('user-by-session error:', err);
    res.status(500).json({});
  }
});

app.get('/requests/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    const qs = await db.collection('Service Data')
      .where('providerId', '==', providerId)
      .where('state', 'in', ['approved', 'request sent', 'confirmed', 'double confirmed','completed']) // all active states
    
      .get();

    const list = qs.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(list);
  } catch (err) {
    console.error('fetch requests error:', err);
    res.status(500).json([]);
  }
});

app.post('/requests/approve', async (req, res) => {
  const { providerId, bookingId } = req.body;

  if (!providerId || !bookingId) {
    return res.status(400).json({ message: 'providerId & bookingId required' });
  }

  try {
    const bookingRef = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingSnap.data();

    if (booking.providerId !== providerId) {
      return res.status(403).json({ message: 'Not authorized to approve this booking' });
    }

    if (booking.state !== 'request sent') {
      return res.status(400).json({ message: `Cannot approve booking in '${booking.state}' state` });
    }

    await bookingRef.update({
      state: 'approved',
      approvedAt: new Date().toISOString(),
    });

    const updatedSnap = await bookingRef.get();
    const updatedBooking = updatedSnap.data();

    await Promise.all([
      db.collection('Service Data (Private)').doc(bookingId).set(updatedBooking),
      db.collection('Service Data (Public)' ).doc(bookingId).set(updatedBooking),
    ]);

    return res.status(200).json({ message: 'Booking approved' });
  } catch (err) {
    console.error('approve error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/requests/cancel', async (req, res) => {
  const { providerId, bookingId, reasons = [] } = req.body;
  
  if (!providerId || !bookingId) {
    return res.status(400).json({ message: 'providerId & bookingId required' });
  }

  try {
    const bookingRef = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingSnap.data();

    if (booking.providerId !== providerId) {
      return res.status(403).json({ message: 'Not your booking' });
    }

    const canCancel = ['request sent', 'approved', 'confirmed'].includes(booking.state);
    if (!canCancel) {
      return res.status(400).json({ 
        message: `Cannot cancel booking in '${booking.state}' state` 
      });
    }

    await bookingRef.update({
      state: 'booking cancelled',
      cancelledByProvider: providerId,
      cancelledAt: new Date().toISOString(),
      providerCancellationReasons: reasons, // Save cancellation reasons
    });

    await Promise.all([
      db.collection('Service Data (Private)').doc(bookingId).delete(),
      db.collection('Service Data (Public)').doc(bookingId).delete(),
    ]);

    if (booking.userId) {
      const userRef = db.collection('User Data').doc(booking.userId);
      await userRef.update({
        bookingIds: admin.firestore.FieldValue.arrayRemove(bookingId),
      });
    }

    return res.json({ 
      message: 'Booking cancelled successfully',
      cancelledAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const bookingRef = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = { id: bookingSnap.id, ...bookingSnap.data() };
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

async function generateOTPsForUpcomingBookings() {
  try {
    const now = Date.now();

    const qs = await db.collection('Service Data')
      .where('state', '==', 'approved')
      .get();

    const tasks = qs.docs.map(async (doc) => {
      const data = doc.data();

      if (data.otpUser || data.otpProvider) return;

      const startMs = new Date(`${data.date}T${data.arrivalTime}:00`).getTime();
      const diff    = startMs - now;              

      if (diff > 5 * 60 * 1000) return;

      // --- generate 6-digit OTPs --------------------------------------
      const otpUser     = String(Math.floor(100000 + Math.random() * 900000));
      const otpProvider = String(Math.floor(100000 + Math.random() * 900000));

      const payload = { ...data, otpUser, otpProvider };

      await Promise.all([
        // master
        db.collection('Service Data').doc(doc.id).update({ otpUser, otpProvider }),

        // customer copy gets ONLY their own OTP
        db.collection('Service Data (Private)').doc(doc.id).set({
          ...payload,
          otp: otpUser,
        }),

        // provider copy gets ONLY their own OTP
        db.collection('Service Data (Public)').doc(doc.id).set({
          ...payload,
          otp: otpProvider,
        }),
      ]);

      console.log(` OTPs generated for booking ${doc.id}`);
    });

    await Promise.all(tasks);
  } catch (err) {
    console.error('OTP generation error:', err);
  }
}
app.post('/verify-provider-otp', async (req, res) => {
  const { bookingId, otp } = req.body;

  try {
    const docRef = db.collection('Service Data').doc(bookingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const data = doc.data();

    // Check if the state is 'approved'
    if (data.state !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking is not in approved state' });
    }

    if (data.otpProvider === otp) {
      await Promise.all([
        docRef.update({ state: 'confirmed' }),
        
        db.collection('Service Data (Private)').doc(bookingId).update({ state: 'confirmed' }),
        
        db.collection('Service Data (Public)').doc(bookingId).update({ state: 'confirmed' })
      ]);

      return res.json({ success: true, message: 'OTP verified and booking confirmed' });
    } else {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

  } catch (error) {
    console.error('Error verifying provider OTP:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/verify-user-otp', async (req, res) => {
  const { bookingId, otp } = req.body;
  if (!bookingId || !otp)
    return res.status(400).json({ success:false, message:'bookingId & otp required' });

  try {
    const ref  = db.collection('Service Data').doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists)
      return res.status(404).json({ success:false, message:'Booking not found' });

    const data = snap.data();

    if (data.state !== 'confirmed')
      return res.status(400).json({ success:false, message:'Booking not in confirmed state' });

    if (data.otpUser === otp) {
      await Promise.all([
        ref.update({ state: 'double confirmed', doubleConfirmedAt: new Date().toISOString() }),
        
        db.collection('Service Data (Private)').doc(bookingId).update({ 
          state: 'double confirmed', 
          doubleConfirmedAt: new Date().toISOString() 
        }),
        
        db.collection('Service Data (Public)').doc(bookingId).update({ 
          state: 'double confirmed', 
          doubleConfirmedAt: new Date().toISOString() 
        })
      ]);
      return res.json({ success:true });
    } else {
      return res.status(400).json({ success:false, message:'Incorrect OTP' });
    }
  } catch (err) {
    console.error('verify-user-otp error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

app.post('/mark-done', async (req, res) => {
  const { bookingId } = req.body;
  try {
    const ref  = db.collection('Service Data').doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success:false, message:'Booking not found' });

    const data = snap.data();
    if (data.state!=  'double confirmed')
      return res.status(400).json({ success:false, message:'Booking not in confirmable state' });

    const startMs = Date.parse(`${data.date}T${data.arrivalTime}:00`);
    const durMin  = parseInt(data.duration || '1',10)*60;
    const quarter = startMs + durMin*0.25*60*1000;
    if (Date.now() < quarter)
      return res.status(400).json({ success:false, message:'Cannot mark done yet' });

await Promise.all([
  ref.update({ state:'completed', completedAt:new Date().toISOString() }),
  
  db.collection('Service Data (Private)').doc(bookingId).update({ 
    state:'completed', completedAt:new Date().toISOString()
  }),
  
  db.collection('Service Data (Public)').doc(bookingId).update({ 
    state:'completed', completedAt:new Date().toISOString()
  })
]);
    res.json({ success:true });
  } catch (e) {
    console.error('mark-done error:', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

async function autoCompleteExpiredBookings() {
  try {
    const now = Date.now();

    const snapshot = await db.collection('Service Data')
      .where('state', 'in', ['request sent', 'approved', 'confirmed', 'double confirmed'])
      .get();

    snapshot.forEach(async doc => {
      const data = doc.data();
      const startTime = new Date(`${data.date}T${data.arrivalTime}:00`).getTime();
      const durationMs = (parseFloat(data.duration) || 1) * 60 * 60 * 1000;
      const endTime     = startTime + durationMs;
      const quarterTime = startTime + 0.25 * durationMs;

      const ref = db.collection('Service Data').doc(doc.id);

      if (data.state === 'double confirmed' && now > endTime) {
        await ref.update({
          state: 'completed',
          completedAt: new Date().toISOString()
        });

        const updatedDoc = await ref.get();
        const updatedData = updatedDoc.data();

        await Promise.all([
          db.collection('Service Data (Private)').doc(doc.id).set(updatedData),
          db.collection('Service Data (Public)' ).doc(doc.id).set(updatedData),
        ]);

        console.log(` Auto-completed booking: ${doc.id}`);
      }

      else if (
        ['request sent', 'approved', 'confirmed'].includes(data.state) &&
        now >= quarterTime
      ) {
        await ref.update({
          state: 'booking cancelled',
          cancelledAt: new Date().toISOString(),
          autoCancelled: true,
        });

        await Promise.all([
          db.collection('Service Data (Private)').doc(doc.id).delete(),
          db.collection('Service Data (Public)').doc(doc.id).delete(),
        ]);

        console.log(`Auto-cancelled booking: ${doc.id}`);
      }
    });
  } catch (err) {
    console.error('Auto-complete error:', err);
  }
}

const isChatAllowed = state =>
  ['approved', 'confirmed', 'double confirmed'].includes(state);

app.get('/chat/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const bookingSnap = await db.collection('Service Data').doc(bookingId).get();
    if (!bookingSnap.exists)
      return res.status(404).json({ message: 'Booking not found' });

    const booking = bookingSnap.data();
    if (!isChatAllowed(booking.state))
      return res.status(403).json({ message: `Chat disabled while booking is '${booking.state}'` });

    const chatSnap = await db
      .collection('Service Data')
      .doc(bookingId)
      .collection('chat')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = chatSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt.toDate(),
    }));

    res.json(messages);
  } catch (err) {
    console.error('Fetch chat error:', err);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

app.post('/chat/send', async (req, res) => {
  try {
    const { bookingId, sender, text, audioData, audioDuration } = req.body;
    if (!bookingId || !sender || !text)
      return res.status(400).json({ message: 'Missing fields' });
    
    const bookingRef = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists)
      return res.status(404).json({ message: 'Booking not found' });
    if (!isChatAllowed(bookingSnap.data().state))
      return res.status(403).json({ message: `Chat disabled while booking is '${bookingSnap.data().state}'` });
    
    const messageData = {
      sender,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (audioData) {
      messageData.audioData = audioData;
      messageData.audioDuration = audioDuration || 0;
    }
    
    const messageRef = await bookingRef.collection('chat').add(messageData);

    io.to(bookingId).emit('new-message', { bookingId });

    res.json({ success: true });
  } catch (err) {
    console.error('Send chat error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});


app.post('/rate-booking', async (req, res) => {
  try {
    const { bookingId, providerId, rating = -1, comment = '' } = req.body;
    
    if (!bookingId || !providerId) {
      return res.status(400).json({ message: 'bookingId & providerId required' });
    }

    const updateData = {
      rated: true,
      rating: rating, 
      ratedAt: new Date().toISOString()
    };

    if (comment.trim()) {
      updateData.comment = comment.trim();
    }

    await Promise.all([
      db.collection('Service Data').doc(bookingId).update(updateData),
      db.collection('Service Data (Private)').doc(bookingId).update(updateData),
      db.collection('Service Data (Public)').doc(bookingId).update(updateData),
    ]);

    // Update provider counters ONLY if rating is positive (1-5)
    if (rating > 0) {
      await db.runTransaction(async t => {
        const ref = db.collection('Provider Info').doc(providerId);
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('provider missing');

        const d = snap.data();
        const updates = { 
          successfulServices: (d.successfulServices || 0) + 1 
        };

        // Only update rating stats if rating is provided (1-5)
        const newTotal = (d.totalRating || 0) + 1;
        const newAvg = (((d.rating || 0) * (d.totalRating || 0)) + rating) / newTotal;
        updates.totalRating = newTotal;
        updates.rating = parseFloat(newAvg.toFixed(2));

        if (comment.trim()) {
          updates.comments = admin.firestore.FieldValue.arrayUnion({
            comment: comment.trim(),
            rating: rating,
            created: new Date().toISOString(),
          });
        }

        t.update(ref, updates);
      });
    } else {
      // If rating is -1 (no rating), still increment successfulServices but don't affect rating
      await db.runTransaction(async t => {
        const ref = db.collection('Provider Info').doc(providerId);
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('provider missing');

        const d = snap.data();
        const updates = { 
          successfulServices: (d.successfulServices || 0) + 1 
        };

        t.update(ref, updates);
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('rate-booking error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/mark-booking-rated', async (req, res) => {
  try {
    const { bookingId, rated = true } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId required' });
    }

    // Update booking in all three collections with rating: -1 (no rating provided)
    const updateData = { 
      rated,
      rating: -1, // -1 signifies customer chose not to rate
      ratedAt: new Date().toISOString()
    };
    
    await Promise.all([
      db.collection('Service Data').doc(bookingId).update(updateData),
      db.collection('Service Data (Private)').doc(bookingId).update(updateData),
      db.collection('Service Data (Public)').doc(bookingId).update(updateData),
    ]);

    res.json({ success: true, message: 'Booking marked as rated without rating' });
  } catch (err) {
    console.error('mark-booking-rated error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

setInterval(() => {
  generateOTPsForUpcomingBookings()
    .catch(err => console.error('OTP generation error:', err));
}, 60 * 1000);

autoCompleteExpiredBookings();
// Then every 1 minute
setInterval(autoCompleteExpiredBookings, 60 * 1000);

// product based section starts
// Enhanced Server Code with better error handling, validation, and features

const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing: missing,
        received: Object.keys(req.body)
      });
    }
    next();
  };
};

// Rate limiting middleware
const rateLimitStore = new Map();
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, []);
    }
    
    const requests = rateLimitStore.get(clientId).filter(time => time > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requests.push(now);
    rateLimitStore.set(clientId, requests);
    next();
  };
};

app.get('/supply-categories', rateLimit(200, 60000), async (req, res) => {
  try {
    console.log('Fetching supply categories...');
    
    const snapshot = await db.collection('Supply Categories').get();
    
    if (snapshot.empty) {
      console.log('No supply categories found');
      return res.json([]);
    }
    
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Category',
        description: data.description || '',
        icon: data.icon || '',
        itemCount: data.itemCount || 0,
        isActive: data.isActive !== false, 
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      };
    });
    
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Retrieved ${categories.length} categories`);
    res.json(categories);
    
  } catch (error) {
    console.error('Supply Categories Error:', error);
    res.status(500).json({ 
      error: 'Failed to load categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.get('/supplies', rateLimit(300, 60000), async (req, res) => {
  try {
    const { 
      q = '', 
      cat = '', 
      page = '1', 
      limit = '50',
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice = '',
      maxPrice = '',
      inStock = ''
    } = req.query;
    
    console.log('Fetching supplies with filters:', { q, cat, page, limit, sortBy, sortOrder });
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50)); 
    const offset = (pageNum - 1) * limitNum;
    
    let query = db.collection('Supplies');
    
    if (cat) {
      query = query.where('categoryId', '==', cat);
    }
    
    // Apply stock filter
    if (inStock === 'true') {
      query = query.where('inStock', '==', true);
    } else if (inStock === 'false') {
      query = query.where('inStock', '==', false);
    }
    
    // Apply price range filters
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      if (!isNaN(minPriceNum)) {
        query = query.where('price', '>=', minPriceNum);
      }
    }
    
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum)) {
        query = query.where('price', '<=', maxPriceNum);
      }
    }
    
    if (sortBy === 'price') {
      query = query.orderBy('price', sortOrder);
    } else if (sortBy === 'createdAt') {
      query = query.orderBy('createdAt', sortOrder);
    } else {
      query = query.orderBy('name', sortOrder);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No supplies found');
      return res.json({
        items: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }
    
    let items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Item',
        description: data.description || '',
        price: data.price || 0,
        categoryId: data.categoryId || '',
        icon: data.icon || '',
        inStock: data.inStock !== false, // Default to true
        stockQuantity: data.stockQuantity || 0,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        tags: data.tags || []
      };
    });
    
    if (q.trim()) {
      const searchQuery = q.toLowerCase().trim();
      const searchTerms = searchQuery.split(' ').filter(term => term.length > 0);
      
      items = items.filter(item => {
        const searchableText = [
          item.name || '',
          item.description || '',
          ...(item.tags || [])
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    const total = items.length;
    const paginatedItems = items.slice(offset, offset + limitNum);
    
    const response = {
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        q, cat, minPrice, maxPrice, inStock, sortBy, sortOrder
      }
    };
    
    console.log(`Retrieved ${paginatedItems.length}/${total} supplies`);
    res.json(response);
    
  } catch (error) {
    console.error('Supplies Load Error:', error);
    res.status(500).json({ 
      error: 'Failed to load supplies',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.post('/order-supply', 
  rateLimit(50, 60000), 
  validateRequest(['sessionId', 'itemId', 'quantity', 'paymentMode']),
  async (req, res) => {
    try {
      const { 
        sessionId, 
        itemId, 
        quantity = 1, 
        paymentMode = 'cash', 
        razorpayPaymentId = null,
        deliveryAddress = null,
        specialInstructions = '',
        customerPhone = '',
        customerEmail = ''
      } = req.body;
      
      console.log('Processing order:', { sessionId, itemId, quantity, paymentMode });
      
      if (!['cash', 'razorpay'].includes(paymentMode)) {
        return res.status(400).json({ error: 'Invalid payment mode' });
      }
      
      const quantityNum = parseInt(quantity, 10);
      if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 100) {
        return res.status(400).json({ error: 'Quantity must be between 1 and 100' });
      }
      
      if (paymentMode === 'razorpay' && !razorpayPaymentId) {
        return res.status(400).json({ error: 'Razorpay payment ID required for online payments' });
      }
      
      console.log('Finding user with sessionId:', sessionId);
      const userSnapshot = await db.collection('User Data').get();
      let userId = null;
      let userData = null;
      let userDocRef = null;
      
      userSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.sessionId === sessionId) {
          userId = doc.id;
          userData = data;
          userDocRef = doc.ref;
        }
      });
      
      if (!userId) {
        console.log('Invalid session ID:', sessionId);
        return res.status(403).json({ error: 'Invalid session. Please login again.' });
      }
      
      console.log('Found user:', userId);
      
      const itemDoc = await db.collection('Supplies').doc(itemId).get();
      if (!itemDoc.exists) {
        console.log('Item not found:', itemId);
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const item = itemDoc.data();
      console.log('Found item:', item.name);
      
      if (item.inStock === false) {
        return res.status(400).json({ error: 'Item is currently out of stock' });
      }
      
      if (item.stockQuantity !== undefined) {
        if (item.stockQuantity === 0) {
          return res.status(400).json({ error: 'Item is out of stock' });
        }
        
        if (item.stockQuantity < quantityNum) {
          return res.status(400).json({ 
            error: 'Insufficient stock',
            available: item.stockQuantity,
            requested: quantityNum
          });
        }
      }
      
      // Calculate pricing
      const unitPrice = item.price || 0;
      const totalCost = unitPrice * quantityNum;
      const tax = totalCost * 0.18; // 18% GST
      const finalAmount = totalCost + tax;
      
      // Generate order ID (internal use only, not to be displayed to user)
      const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create order document
      const order = {
        orderId,
        userId,
        sessionId,
        itemId,
        itemName: item.name,
        itemIcon: item.icon || '',
        categoryId: item.categoryId || '',
        quantity: quantityNum,
        unitPrice,
        totalCost,
        tax,
        finalAmount,
        paymentMode,
        razorpayPaymentId: razorpayPaymentId || null,
        deliveryAddress: deliveryAddress || userData?.address || null,
        specialInstructions: specialInstructions.trim(),
        customerPhone: customerPhone || userData?.contact || '',
        customerEmail: customerEmail || userData?.email || '',
        status: paymentMode === 'razorpay' ? 'bought' : 'cart',
        paymentStatus: paymentMode === 'razorpay' ? 'completed' : 'pending',
        orderedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save order to database
      const orderRef = await db.collection('Supply Orders').add(order);
      console.log('Order created with ID:', orderRef.id);
      
      if (item.stockQuantity !== undefined) {
        const newStock = Math.max(0, item.stockQuantity - quantityNum);
        await db.collection('Supplies').doc(itemId).update({
          stockQuantity: newStock,
          inStock: newStock > 0,
          updatedAt: new Date().toISOString()
        });
      }
      
      // IMPORTANT: Update user's orders array in User Data (or Prover Info)
      const userOrders = userData.orders || [];
      userOrders.push({
        orderId: orderRef.id,
        status: order.status,
        itemId: itemId,
        itemName: item.name,
        quantity: quantityNum,
        totalAmount: finalAmount,
        paymentMode: paymentMode,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });
      
      await userDocRef.update({
        orders: userOrders,
        updatedAt: new Date().toISOString()
      });
      
      const response = {
        success: true,
        message: 'Order placed successfully',
        amount: finalAmount,
        paymentMode,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        item: {
          name: item.name,
          quantity: quantityNum,
          price: unitPrice
        }
      };
      
      console.log('Order processed successfully');
      res.json(response);
      
    } catch (error) {
      console.error('Order Processing Error:', error);
      res.status(500).json({ 
        error: 'Failed to process order',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

app.get('/user-order-history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    
    // Find user
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userId = userSnapshot.docs[0].id;
    
    // Get all orders for this user (exclude cancelled)
    const ordersSnapshot = await db.collection('Supply Orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      if (orderData.status !== 'cancelled') {
        orders.push({
          id: doc.id,
          ...orderData
        });
      }
    });
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(50, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;
    const paginatedOrders = orders.slice(offset, offset + limitNum);
    
    res.json({
      orders: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: orders.length,
        pages: Math.ceil(orders.length / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

app.post('/cancel-order', async (req, res) => {
  try {
    const { sessionId, orderId, reason = '' } = req.body;
    
    if (!sessionId || !orderId) {
      return res.status(400).json({ error: 'Session ID and Order ID required' });
    }
    
    // Verify user
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userId = userSnapshot.docs[0].id;
    const userDocRef = userSnapshot.docs[0].ref;
    const userData = userSnapshot.docs[0].data();
    
    // Get order
    const orderDoc = await db.collection('Supply Orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderDoc.data();
    
    if (orderData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled', 'shipped'];
    if (nonCancellableStatuses.includes(orderData.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel order with status: ${orderData.status}` 
      });
    }
    
    await db.collection('Supply Orders').doc(orderId).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      updatedAt: new Date().toISOString()
    });
    
    if (orderData.itemId) {
      const itemDoc = await db.collection('Supplies').doc(orderData.itemId).get();
      if (itemDoc.exists) {
        const currentStock = itemDoc.data().stockQuantity || 0;
        await db.collection('Supplies').doc(orderData.itemId).update({
          stockQuantity: currentStock + orderData.quantity,
          inStock: true,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    const userOrders = userData.orders || [];
    const updatedOrders = userOrders.map(order => 
      order.orderId === orderId 
        ? { ...order, status: 'cancelled', updatedAt: new Date().toISOString() }
        : order
    );
    
    await userDocRef.update({
      orders: updatedOrders,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Order cancelled successfully' });
    
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});


// Get product ratings
app.get('/product-ratings/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const ratingsSnapshot = await db.collection('Product Ratings')
      .where('itemId', '==', itemId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const ratings = [];
    let totalRating = 0;
    
    ratingsSnapshot.forEach(doc => {
      const ratingData = doc.data();
      ratings.push({
        id: doc.id,
        ...ratingData,
        userEmail: undefined
      });
      totalRating += ratingData.rating || 0;
    });
    
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;
    
    res.json({
      ratings,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: ratings.length
    });
    
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to retrieve ratings' });
  }
});

// Check if user has rated a product
app.get('/user-product-rating/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ hasRated: false });
    }
    
    const userId = userSnapshot.docs[0].id;
    
    // Check for existing rating
    const ratingSnapshot = await db.collection('Product Ratings')
      .where('itemId', '==', itemId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (ratingSnapshot.empty) {
      return res.json({ hasRated: false });
    }
    
    const ratingData = ratingSnapshot.docs[0].data();
    res.json({
      hasRated: true,
      ratingId: ratingSnapshot.docs[0].id,
      rating: ratingData.rating,
      review: ratingData.review
    });
    
  } catch (error) {
    console.error('Check user rating error:', error);
    res.status(500).json({ error: 'Failed to check rating' });
  }
});

// Add or update product rating
app.post('/rate-product', async (req, res) => {
  try {
    const { sessionId, itemId, rating, review = '' } = req.body;
    
    if (!sessionId || !itemId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userId = userSnapshot.docs[0].id;
    const userName = userSnapshot.docs[0].data().name || 'Anonymous';
    
    // Check for existing rating
    const existingRatingSnapshot = await db.collection('Product Ratings')
      .where('itemId', '==', itemId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    const ratingData = {
      rating: parseInt(rating),
      review: review.trim(),
      userName,
      updatedAt: new Date().toISOString()
    };
    
    let ratingId;
    
    if (!existingRatingSnapshot.empty) {
      // Update existing rating
      ratingId = existingRatingSnapshot.docs[0].id;
      await db.collection('Product Ratings').doc(ratingId).update(ratingData);
    } else {
      // Create new rating
      const newRating = await db.collection('Product Ratings').add({
        ...ratingData,
        itemId,
        userId,
        createdAt: new Date().toISOString()
      });
      ratingId = newRating.id;
    }
    
    await updateProductAverageRating(itemId);
    
    res.json({ 
      success: true, 
      message: existingRatingSnapshot.empty ? 'Rating added' : 'Rating updated',
      ratingId
    });
    
  } catch (error) {
    console.error('Rate product error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Helper function to update product average rating
async function updateProductAverageRating(itemId) {
  try {
    const ratingsSnapshot = await db.collection('Product Ratings')
      .where('itemId', '==', itemId)
      .get();
    
    let totalRating = 0;
    let count = 0;
    
    ratingsSnapshot.forEach(doc => {
      totalRating += doc.data().rating || 0;
      count++;
    });
    
    const averageRating = count > 0 ? totalRating / count : 0;
    
    await db.collection('Supplies').doc(itemId).update({
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: count,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update average rating error:', error);
  }
}

app.get('/wishlist/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userData = userSnapshot.docs[0].data();
    const wishlistIds = userData.wishlist || [];
    
    const items = [];
    for (const itemId of wishlistIds) {
      const itemDoc = await db.collection('Supplies').doc(itemId).get();
      if (itemDoc.exists) {
        items.push({ id: itemDoc.id, ...itemDoc.data() });
      }
    }
    
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

app.post('/add-to-wishlist', async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const wishlist = userData.wishlist || [];
    
    if (!wishlist.includes(itemId)) {
      wishlist.push(itemId);
      await userDoc.ref.update({ wishlist });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

app.post('/remove-from-wishlist', async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const wishlist = userData.wishlist || [];
    
    await userDoc.ref.update({
      wishlist: wishlist.filter(id => id !== itemId)
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

app.get('/order-detail/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const userSnapshot = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    
    const userId = userSnapshot.docs[0].id;
    
    const orderDoc = await db.collection('Supply Orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = orderDoc.data();
    
    if (orderData.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      id: orderDoc.id,
      ...orderData
    });
    
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

app.patch('/order-status/:orderId', 
  rateLimit(50, 60000),
  validateRequest(['status']),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, adminId, notes = '' } = req.body;
      
      const validStatuses = ['cart', 'bought', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const orderDoc = await db.collection('Supply Orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const orderData = orderDoc.data();
      
      await db.collection('Supply Orders').doc(orderId).update({
        status,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: adminId || 'system',
        statusNotes: notes
      });
      
      const userSnapshot = await db.collection('User Data').get();
      let userDocRef = null;
      let userOrders = [];
      
      userSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.sessionId === orderData.sessionId) {
          userDocRef = doc.ref;
          userOrders = data.orders || [];
        }
      });
      
      if (userDocRef) {
        const orderIndex = userOrders.findIndex(o => o.orderId === orderId);
        if (orderIndex >= 0) {
          userOrders[orderIndex].status = status;
          userOrders[orderIndex].updatedAt = new Date().toISOString();
          
          await userDocRef.update({
            orders: userOrders,
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      res.json({ success: true, status });
      
    } catch (error) {
      console.error('Update Order Status Error:', error);
      res.status(500).json({ 
        error: 'Failed to update order status',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

app.get('/supply/:itemId', rateLimit(200, 60000), async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const itemDoc = await db.collection('Supplies').doc(itemId).get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = {
      id: itemDoc.id,
      ...itemDoc.data()
    };
    
    if (item.categoryId) {
      const categoryDoc = await db.collection('Supply Categories').doc(item.categoryId).get();
      if (categoryDoc.exists) {
        item.category = {
          id: categoryDoc.id,
          name: categoryDoc.data().name || 'Unnamed Category'
        };
      }
    }
    
    res.json(item);
    
  } catch (error) {
    console.error('Get Supply Item Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve item',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});


app.get('/query-threads/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSnap = await db.collection('User Data') 
      .where('sessionId', '==', sessionId) 
      .limit(1) 
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ threads: [] }); 
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id; 
    let queries = userDoc.data().queries || [];

    if (queries.length === 0) {
      await userDoc.ref.update({
        queries: [] 
      });
      queries = [];
    }

    // fetch all threads (will be empty if no queries)
    const threads = await Promise.all(
      queries.map(async threadId => {
        const threadDoc = await db.collection('Query Threads').doc(threadId).get();
        if (!threadDoc.exists) return null;

        const data = threadDoc.data();
        const msgSnap = await db.collection('Query Threads')
          .doc(threadId)
          .collection('messages')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        const lastMsg = msgSnap.empty ? '' : msgSnap.docs[0].data().text;

        return {
          id: threadId,
          title: data.title || 'Query',
          lastMessage: lastMsg,
          sender: data.starterRole || 'user',
        };
      })
    );

    res.json({ threads: threads.filter(Boolean) });
  } catch (err) {
    console.error('GET /query-threads error:', err);
    res.status(500).json({ threads: [] });
  }
});

app.get('/query-thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const msgs = await db.collection('Query Threads')
      .doc(threadId)
      .collection('messages')
      .orderBy('createdAt')
      .get();

    res.json({
      threadId,
      messages: msgs.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    });
  } catch (err) {
    console.error('GET /query-thread error:', err);
    res.status(500).json({ messages: [] });
  }
});

app.post('/create-query-thread', async (req, res) => {
  try {
    const { sessionId, title = '' } = req.body;

    const snap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const userDoc = snap.docs[0];
    const userId = userDoc.id;

    const ref = await db.collection('Query Threads').add({
      title: title.substring(0, 50) || 'Query',
      starterRole: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('User Data').doc(userId).update({
      queries: admin.firestore.FieldValue.arrayUnion(ref.id),
    });

    res.json({ threadId: ref.id });
  } catch (err) {
    console.error('POST /create-query-thread error:', err);
    res.status(500).json({ message: 'Failed to create thread' });
  }
});

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

app.post('/send-query', async (req, res) => {
  const { sessionId, text, threadId } = req.body;
  if (!sessionId || !text || !threadId)
    return res.status(400).json({ message: 'Missing fields' });

  try {
    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (userSnap.empty) return res.status(404).json({ message: 'User not found' });

    const userId = userSnap.docs[0].id;

    await db.collection('Query Threads')
      .doc(threadId)
      .collection('messages')
      .add({
        text,
        sender: 'user',
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: Date.now()
      });

    const servicesSnapshot = await db.collection('Service Info').get();
    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const servicesList = services.map(service => 
      `- ${service.title}: ${service.description || 'No description available'}`
    ).join('\n');

    // Gemini API call with services information
    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `USER'S QUERY: ${text}

AVAILABLE SERVICES:
${servicesList}

INSTRUCTIONS:
1. Respond helpfully to the user's query
2. Use **double asterisks** around important terms or key points to make them bold
3. If any of the above services could help solve the user's problem, recommend them
4. Format your response as follows:
   - First, provide your helpful response (use **bold** for emphasis)
   - Then, if services are relevant, add: [RECOMMENDED_SERVICES: service_title_1, service_title_2, ...]
   - Only include service titles that exactly match from the available services list
   - If no services are relevant, don't include the recommended services section

Example response format:
"Your main **helpful response** goes here with important terms in **bold**.

[RECOMMENDED_SERVICES: Plumbing Service, Electrical Repair]"`
          }]
        }]
      })
    });
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const geminiData = await geminiResponse.json();
    const fullReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!fullReply) {
      throw new Error('No response text from Gemini');
    }

    let replyText = fullReply;
    let recommendedServices = [];

    const serviceMatch = fullReply.match(/\[RECOMMENDED_SERVICES:\s*(.*?)\s*\]/i);
    if (serviceMatch && serviceMatch[1]) {
      const serviceTitles = serviceMatch[1].split(',').map(title => title.trim());
      
      for (const title of serviceTitles) {
        const serviceSnap = await db.collection('Service Info')
          .where('title', '==', title)
          .limit(1)
          .get();

        if (!serviceSnap.empty) {
          const doc = serviceSnap.docs[0];
          recommendedServices.push({
            id: doc.id,
            title: doc.data().title,
            description: doc.data().description || ''
          });
        }
      }

      replyText = replyText.replace(serviceMatch[0], '').trim();
    }

    // Store AI reply
    if (replyText) {
      await db.collection('Query Threads')
        .doc(threadId)
        .collection('messages')
        .add({
          text: replyText,
          sender: 'ai',
          recommendedServices: recommendedServices.length > 0 ? recommendedServices : null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.json({ 
      reply: replyText, 
      recommendedServices: recommendedServices.length > 0 ? recommendedServices : null 
    });

  } catch (err) {
    console.error('send-query error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/query-thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { sessionId } = req.body; 

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    const userQueries = userData.queries || [];

    // Check if user has access to this thread
    if (!userQueries.includes(threadId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove thread ID from user's queries array
    const updatedQueries = userQueries.filter(id => id !== threadId);
    await userDoc.ref.update({
      queries: updatedQueries
    });

    const threadRef = db.collection('Query Threads').doc(threadId);
    
    const messagesSnapshot = await threadRef.collection('messages').get();
    const deleteMessages = messagesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteMessages);

    await threadRef.delete();

    res.json({ success: true, message: 'Thread deleted successfully' });

  } catch (err) {
    console.error('DELETE /query-thread error:', err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

app.get('/provider-completed-bookings/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    const qs = await db.collection('Service Data (Public)')
      .where('providerId', '==', providerId)
      .where('state', '==', 'completed')
      .get();

    const bookings = [];
    qs.forEach(doc => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(bookings);
  } catch (err) {
    console.error('provider-completed-bookings error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Start server

const updateConfigFile = (ip, port) => {
  const configPath = '...Service_Bazaar\\code\\frontend\\utils\\config.js'; //replace with the appropriate path
  
  const configContent = `const BASE_URL = 'http://${ip}:${port}';\n\nexport default {\n  BASE_URL,\n};\n`;

  try {
    fs.writeFileSync(configPath, configContent);
    console.log(' Config file updated with current IP');
  } catch (error) {
    console.error(' Failed to update config file:', error.message);
  }
};

app.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('\n Server running at:');
  console.log(` Local:   http://localhost:${PORT}`);
  console.log(` Network: http://${ip}:${PORT}\n`);
  updateConfigFile(ip, PORT);
});