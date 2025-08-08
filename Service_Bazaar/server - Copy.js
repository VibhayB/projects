const express     = require('express');
const cors        = require('cors');
const bodyParser  = require('body-parser');
const crypto      = require('crypto');
const nodemailer  = require('nodemailer');
const os          = require('os');
const bcrypt      = require('bcrypt');
const admin       = require('firebase-admin');

const app  = express();
const PORT = 3000;
const fetch = require('node-fetch'); 

const GEMINI_API_KEY = 'APIKEY'; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


const serviceAccount = require('./file.json');  

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db              = admin.firestore();
const userCollection   = db.collection('User Data');          

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'email@gmail.com', 
    pass: 'pass',      
  },
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const otpStore = {}; 

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
    const snapshot = await db.collection('Service Info.').get();
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
  const { lat, lng, radius = 25 } = req.query;       

  try {
    const snap = await db
      .collection('Provider Info')
      .where('serviceId', '==', serviceId)
      .get();

    let providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxKm   = parseFloat(radius);

      const haversine = (la1, lo1, la2, lo2) => {
        const R  = 6371;                      
        const dL = ((la2 - la1) * Math.PI) / 180;
        const dO = ((lo2 - lo1) * Math.PI) / 180;
        const a  =
          Math.sin(dL / 2) ** 2 +
          Math.cos((la1 * Math.PI) / 180) *
            Math.cos((la2 * Math.PI) / 180) *
            Math.sin(dO / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
      };

      providers = providers.filter(p => {
        if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return false;
        return haversine(userLat, userLng, p.lat, p.lng) <= maxKm;
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
  const expiresAt  = Date.now() + 5 * 60 * 1000; 
  otpStore[email]  = { otp, expiresAt, attempts: 0 };

  try {
    await transporter.sendMail({
      from: 'email@gmail.com',
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
    const userId  = userDoc.id;

    const bookingRef = db.collection('Service Data').doc(); 
    const bookingId  = bookingRef.id;
    const timestamp  = new Date().toISOString();

    const record = {
      ...payload,                      
      providerId : payload.id ?? payload.providerId, 
      userId,
      state     : 'request sent',
      createdAt : timestamp,
    };
    
    await Promise.all([
      bookingRef.set(record),
      db.collection('Service Data (Private)').doc(bookingId).set(record),
      db.collection('Service Data (Public)') .doc(bookingId).set(record),
      userDoc.ref.update({
        bookingIds: admin.firestore.FieldValue.arrayUnion(bookingId),
      }),
    ]);

    return res.status(200).json({ message: 'Booking saved', bookingId });
  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/bookings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();
    if (userSnap.empty) return res.status(404).json([]);

    const userDoc = userSnap.docs[0];
    const bookingIds = userDoc.data().bookingIds || [];   
    if (!bookingIds.length) return res.status(200).json([]);

    const docs = await Promise.all(
      bookingIds.map(id =>
        db.collection('Service Data (Private)').doc(id).get()
      )
    );

    const list = docs
      .filter(d => d.exists && d.data().state !== 'booking cancelled')
      .map(d => ({ id: d.id, ...d.data() }));

    return res.status(200).json(list);
  } catch (e) {
    console.error('Fetch bookings error:', e);
    res.status(500).json([]);
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

    if (b.state === 'booking cancelled' || b.state === 'completed' || b.state === 'completed rated' )
      return res.status(400).json({ message: 'Invalid cancelation' });

    const now = Date.now();
    const startMs = Date.parse(`${b.date}T${b.arrivalTime}:00`);
    const durMin  = parseInt(b.duration || '1', 10) * 60;
    const quarterMs = startMs + durMin * 0.25 * 60_000;

    const cancelAllowed =
      ['request sent', 'approved','confirmed'].includes(b.state) ||
      (
        ['double confirmed'].includes(b.state) &&
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
    const { sessionId, name, contact, address, skills } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

    const snap = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    await snap.docs[0].ref.update({ name, contact, address, skills });
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
      name   : data.name    || '',
      contact: data.contact || '',
      address: data.address || '',
      skills : data.skills  || '',
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
    const userId  = userDoc.id;

    const existing = await db.collection('Provider Application')
      .where('userId', '==', userId).limit(1).get();
    if (!existing.empty)
      return res.status(409).json({ message: 'Application already submitted' });

    await db.collection('Provider Application').add({
      userId,
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
      .where('state', 'in', ['approved', 'request sent', 'confirmed', 'double confirmed'])
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
  const { providerId, bookingId } = req.body;
  if (!providerId || !bookingId)
    return res.status(400).json({ message: 'providerId & bookingId required' });

  try {
    const bookingRef  = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists)
      return res.status(404).json({ message: 'Booking not found' });

    const booking = bookingSnap.data();

    
    if (booking.providerId !== providerId)
      return res.status(403).json({ message: 'Not your booking' });

    const canCancel = ['request sent', 'approved', 'confirmed'].includes(booking.state);
    if (!canCancel)
      return res
        .status(400)
        .json({ message: `Cannot cancel booking in '${booking.state}' state` });

    await bookingRef.update({
      state: 'booking cancelled',
      cancelledByProvider: providerId,
      cancelledAt: new Date().toISOString(),
    });

    await Promise.all([
      db.collection('Service Data (Private)').doc(bookingId).delete(),
      db.collection('Service Data (Public)' ).doc(bookingId).delete(),
    ]);

    return res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error('cancel error:', err);
    return res.status(500).json({ message: 'Internal server error' });
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

      if (diff > 5 * 60 * 1000 || diff < 0) return;

      const otpUser     = String(Math.floor(100000 + Math.random() * 900000));
      const otpProvider = String(Math.floor(100000 + Math.random() * 900000));

      const payload = { ...data, otpUser, otpProvider };

      await Promise.all([
        db.collection('Service Data').doc(doc.id).update({ otpUser, otpProvider }),

        db.collection('Service Data (Private)').doc(doc.id).set({
          ...payload,
          otp: otpUser,
        }),

        db.collection('Service Data (Public)').doc(doc.id).set({
          ...payload,
          otp: otpProvider,
        }),
      ]);

      console.log(`✅ OTPs generated for booking ${doc.id}`);
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

    if (data.state !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking is not in approved state' });
    }

    if (data.otpProvider === otp) {
      await docRef.update({ state: 'confirmed' });

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
      await ref.update({ state:'double confirmed', doubleConfirmedAt: new Date().toISOString() });
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
    if (data.state!='confirmed','double confirmed')
      return res.status(400).json({ success:false, message:'Booking not in confirmable state' });

    const startMs = Date.parse(`${data.date}T${data.arrivalTime}:00`);
    const durMin  = parseInt(data.duration || '1',10)*60;
    const quarter = startMs + durMin*0.25*60*1000;
    if (Date.now() < quarter)
      return res.status(400).json({ success:false, message:'Cannot mark done yet' });

    await ref.update({ state:'completed', completedAt:new Date().toISOString() });
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

        console.log(`✅ Auto-completed booking: ${doc.id}`);
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

        console.log(`❌ Auto-cancelled booking: ${doc.id}`);
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
      id        : d.id,
      ...d.data(),
      createdAt : d.data().createdAt.toDate(),
    }));

    res.json(messages);
  } catch (err) {
    console.error('Fetch chat error:', err);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

app.post('/chat/send', async (req, res) => {
  try {
    const { bookingId, sender, text } = req.body;
    if (!bookingId || !sender || !text)
      return res.status(400).json({ message: 'Missing fields' });

    const bookingRef  = db.collection('Service Data').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists)
      return res.status(404).json({ message: 'Booking not found' });

    if (!isChatAllowed(bookingSnap.data().state))
      return res.status(403).json({ message: `Chat disabled while booking is '${bookingSnap.data().state}'` });

    await bookingRef.collection('chat').add({
      sender,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Send chat error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});


app.post('/rate-booking', async (req, res) => {
  try {
    const { bookingId, providerId, rating = 0, comment = '', anonymous = false } = req.body;
    if (!bookingId || !providerId) {
      return res.status(400).json({ message: 'bookingId & providerId required' });
    }

    await db.collection('Service Data').doc(bookingId).update({ state: 'completed rated' });
    await Promise.all([
      db.collection('Service Data (Private)').doc(bookingId).update({ state: 'completed rated' }),
      db.collection('Service Data (Public)' ).doc(bookingId).update({ state: 'completed rated' }),
    ]);

    await db.runTransaction(async t => {
      const ref  = db.collection('Provider Info').doc(providerId);
      const snap = await t.get(ref);
      if (!snap.exists) throw new Error('provider missing');

      const d        = snap.data();
      const updates  = { 
        successfulServices: (d.successfulServices || 0) + 1 
      };

      if (rating > 0) {
        const newTotal = (d.totalRating || 0) + 1;
        const newAvg   = (((d.rating || 0) * (d.totalRating || 0)) + rating) / newTotal;
        updates.totalRating = newTotal;
        updates.rating      = parseFloat(newAvg.toFixed(2));
      }

      if (comment.trim()) {
        updates.comments = admin.firestore.FieldValue.arrayUnion({
          name   : anonymous ? 'Anonymous' : 'User',
          comment: comment.trim(),
          created: new Date().toISOString(),
        });
      }

      t.update(ref, updates);
    });

    res.json({ success: true });
  } catch (err) {
    console.error('rate-booking error:', err);
    res.status(500).json({ message: 'internal' });
  }
});


setInterval(() => {
  generateOTPsForUpcomingBookings()
    .catch(err => console.error('OTP generation error:', err));
}, 60 * 1000);

autoCompleteExpiredBookings();

setInterval(autoCompleteExpiredBookings, 60 * 1000);

app.get('/supply-categories', async (req, res) => {
  try {
    const snapshot = await db.collection('Supply Categories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (e) {
    console.error('Supply Categories Error:', e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.get('/supplies', async (req, res) => {
  try {
    const { q = '', cat = '' } = req.query;
    let query = db.collection('Supplies');

    if (cat) query = query.where('categoryId', '==', cat);

    const snapshot = await query.get();
    let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (q.trim()) {
      const qLower = q.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(qLower) ||
        item.description?.toLowerCase().includes(qLower)
      );
    }

    res.json(items);
  } catch (e) {
    console.error('Supplies Load Error:', e);
    res.status(500).json({ error: 'Failed to load supplies' });
  }
});

app.post('/order-supply', async (req, res) => {
  try {
    const { sessionId, itemId, quantity = 1, paymentMode = 'cash', razorpayPaymentId = null } = req.body;

    if (!sessionId || !itemId || !quantity || !paymentMode) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const userSnap = await db.collection('User Data').get();
    let userId = null;
    userSnap.forEach(doc => {
      if (doc.data().sessionId === sessionId) userId = doc.id;
    });

    if (!userId) return res.status(403).json({ error: 'Invalid session' });

    const itemDoc = await db.collection('Supplies').doc(itemId).get();
    if (!itemDoc.exists) return res.status(404).json({ error: 'Item not found' });

    const item = itemDoc.data();

    const order = {
      userId,
      sessionId,
      itemId,
      itemName: item.name,
      quantity,
      totalCost: item.price * quantity,
      paymentMode,
      razorpayPaymentId: razorpayPaymentId || null,
      orderedAt: new Date().toISOString(),
      status: 'pending',
    };

    const newDoc = await db.collection('Supply Orders').add(order);

    res.json({ success: true, orderId: newDoc.id });
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.get('/query-threads/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const userSnap = await db.collection('User Data')
      .where('sessionId', '==', sessionId).limit(1).get();

    if (userSnap.empty) return res.status(404).json({ threads: [] });

    const userId = userSnap.docs[0].id;

    const threadSnap = await db.collection('Query Threads')
      .where('participants', 'array-contains', userId).get();

    const threads = await Promise.all(threadSnap.docs.map(async doc => {
      const data = doc.data();

      const msgSnap = await db.collection('Query Threads')
        .doc(doc.id)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(1).get();

      const lastMsg = msgSnap.empty ? '' : msgSnap.docs[0].data().text;

      return {
        id: doc.id,
        title: data.title || 'Query',
        lastMessage: lastMsg,
        sender: data.starterRole || 'user',
      };
    }));

    res.json({ threads });
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
      .orderBy('createdAt').get();

    res.json({
      threadId,
      messages: msgs.docs.map(doc => doc.data()),
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
      .where('sessionId', '==', sessionId).limit(1).get();

    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const userId = snap.docs[0].id;
    const isProvider = snap.docs[0].data().isProvider;
    const starterRole = isProvider ? 'provider' : 'user';

    const ref = await db.collection('Query Threads').add({
      title,
      participants: [userId],
      starterRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ threadId: ref.id });
  } catch (err) {
    console.error('POST /create-query-thread error:', err);
    res.status(500).json({ message: 'Failed to create thread' });
  }
});
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
      });

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{
              text: `User's query: ${text}\n\nRespond helpfully. If a specific service could help the user, end your reply with:\n\n[RECOMMENDED_SERVICE: <service title>]\n\nOtherwise, don't include anything.`,
            }],
          }
        ]
      }),
    });

    const geminiData = await geminiResponse.json();
    const fullReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let replyText = fullReply;
    let recommendedServiceId = null;

    const match = fullReply.match(/\[RECOMMENDED_SERVICE:\s*(.*?)\s*\]/i);
    if (match && match[1]) {
      const recommendedTitle = match[1].trim();

      const serviceSnap = await db.collection('Service Info.')
        .where('title', '==', recommendedTitle)
        .limit(1)
        .get();

      if (!serviceSnap.empty) {
        const doc = serviceSnap.docs[0];
        recommendedServiceId = doc.id;
        replyText = replyText.replace(match[0], '').trim(); 
      }
    }

    if (replyText) {
      await db.collection('Query Threads')
        .doc(threadId)
        .collection('messages')
        .add({
          text: replyText,
          sender: 'ai',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.json({ reply: replyText, recommendedServiceId });
  } catch (err) {
    console.error('send-query error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/provider-stats/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { month }      = req.query;         

    if (!providerId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Invalid providerId or month format' });
    }

    const start = `${month}-01`;
    const end   = `${month}-31`;

    const qs = await db.collection('Service Data')
      .where('providerId', '==', providerId)
      .where('date', '>=', start)
      .where('date', '<=', end)
      .get();

    let total = 0,
        completed = 0,
        cancelled = 0,
        revenue   = 0;

    qs.forEach(doc => {
      const d = doc.data();
      total++;

      /* count both states as finished work */
      if (d.state === 'completed' || d.state === 'completed rated') {
        completed++;
        revenue += Number(d.price || 0);
      }

      if (d.state === 'booking cancelled') {
        cancelled++;
      }
    });

    return res.json({ total, completed, cancelled, revenue });
  } catch (err) {
    console.error('provider-stats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('\n✅ Server running at:');
  console.log(`🔗 Local:   http://localhost:${PORT}`);
  console.log(`📱 Network: http://${ip}:${PORT}\n`);
});