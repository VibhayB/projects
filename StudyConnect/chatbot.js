const intents = { "intents" : [
 {
   "tag": "greeting",
   "patterns": [
      "Hi",
      "How are you?",
      "Is anyone there?",
      "Hello",
      "Good day",
      "What's up",
      "how are ya",
      "heyy",
      "whatsup",
      "??? ??? ??"
   ],
   "responses": [
      "Hello!",
      "Good to see you again!",
      "Hi there, how can I help?"
   ],
   "context_set": ""
},
 {
   "tag": "goodbye",
   "patterns": [
      "cya",
      "see you",
      "bye bye",
      "See you later",
      "Goodbye",
      "I am Leaving",
      "Bye",
      "Have a Good day",
      "talk to you later",
      "ttyl",
      "i got to go",
      "gtg"
   ],
   "responses": [
      "Sad to see you go :(",
      "Talk to you later",
      "Goodbye!",
      "Come back soon"
   ],
   "context_set": ""
},
 {
   "tag": "creator",
   "patterns": [
      "what is the name of your developers",
      "what is the name of your creators",
      "what is the name of the developers",
      "what is the name of the creators",
      "who created you",
      "your developers",
      "your creators",
      "who are your developers",
      "developers",
      "you are made by",
      "you are made by whom",
      "who created you",
      "who create you",
      "creators",
      "who made you",
      "who designed you"
   ],
   "responses": [
      "Who knows, do you know?"
   ],
   "context_set": ""
},
 {
   "tag": "name",
   "patterns": [
      "name",
      "your name",
      "do you have a name",
      "what are you called",
      "what is your name",
      "what should I call you",
      "whats your name?",
      "what are you",
      "who are you",
      "who is this",
      "what am i chatting to",
      "who am i taking to",
      "what are you"
   ],
   "responses": [
      "You can call me Mind Reader.",
      "I'm Mind Reader",
      "I am a Chatbot.",
      "I am your helper"
   ],
   "context_set": ""
},
 {
   "tag": "hours",
   "patterns": [
      "timing of college",
      "what is college timing",
      "working days",
      "when are you guys open",
      "what are your hours",
      "hours of operation",
      "when is the college open",
      "college timing",
      "what about college timing",
      "is college open on saturday",
      "tell something about college timing",
      "what is the college  hours",
      "when should i come to college",
      "when should i attend college",
      "what is my college time",
      "college timing",
      "timing college"
   ],
   "responses": [
      "College is open 8am-5pm Monday-Saturday!"
   ],
   "context_set": ""
},
 {
   "tag": "number",
   "patterns": [
      "more info",
      "contact info",
      "how to contact college",
      "college telephone number",
      "college number",
      "What is your contact no",
      "Contact number?",
      "how to call you",
      "College phone no?",
      "how can i contact you",
      "Can i get your phone number",
      "how can i call you",
      "phone number",
      "phone no",
      "call"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "course",
   "patterns": [
      "list of courses",
      "list of courses offered",
      "list of courses offered in",
      "what are the courses offered in your college?",
      "courses?",
      "courses offered",
      "courses offered in (your univrsity(UNI) name)",
      "courses you offer",
      "branches?",
      "courses available at UNI?",
      "branches available at your college?",
      "what are the courses in UNI?",
      "what are branches in UNI?",
      "what are courses in UNI?",
      "branches available in UNI?",
      "can you tell me the courses available in UNI?",
      "can you tell me the branches available in UNI?",
      "computer engineering?",
      "computer",
      "Computer engineering?",
      "it",
      "IT",
      "Information Technology",
      "AI/Ml",
      "Mechanical engineering",
      "Chemical engineering",
      "Civil engineering"
   ],
   "responses": [
      "Our university offers Information Technology, computer Engineering, Mechanical engineering,Chemical engineering, Civil engineering and extc Engineering."
   ],
   "context_set": ""
},
 {
   "tag": "fees",
   "patterns": [
      "information about fee",
      "information on fee",
      "tell me the fee",
      "college fee",
      "fee per semester",
      "what is the fee of each semester",
      "what is the fees of each year",
      "what is fee",
      "what is the fees",
      "how much is the fees",
      "fees for first year",
      "fees",
      "about the fees",
      "tell me something about the fees",
      "What is the fees of hostel",
      "how much is the fees",
      "hostel fees",
      "fees for AC room",
      "fees for non-AC room",
      "fees for Ac room for girls",
      "fees for non-Ac room for girls",
      "fees for Ac room for boys",
      "fees for non-Ac room for boys"
   ],
   "responses": [
      "For Fee detail visit <a target=\"_blank\" href=\"mru.edu.in\"> here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "location",
   "patterns": [
      "where is the college located",
      "college is located at",
      "where is college",
      "where is college located",
      "address of college",
      "how to reach college",
      "college location",
      "college address",
      "wheres the college",
      "how can I reach college",
      "whats is the college address",
      "what is the address of college",
      "address",
      "location"
   ],
   "responses": [
      "College is located in Faridabad, Harayana, For more details click <a target=\"_blank\" href=\"mru.edu.in\"> here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "hostel",
   "patterns": [
      "hostel facility",
      "hostel servive",
      "hostel location",
      "hostel address",
      "hostel facilities",
      "hostel fees",
      "Does college provide hostel",
      "Is there any hostel",
      "Where is hostel",
      "do you have hostel",
      "do you guys have hostel",
      "hostel",
      "hostel capacity",
      "what is the hostel fee",
      "how to get in hostel",
      "what is the hostel address",
      "how far is hostel from college",
      "hostel college distance",
      "where is the hostel",
      "how big is the hostel",
      "distance between college and hostel",
      "distance between hostel and college"
   ],
   "responses": [
      "For hostel detail visit <a target=\"_blank\" href=\"mru.edu.in\"> here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "event",
   "patterns": [
      "events organised",
      "list of events",
      "list of events organised in college",
      "list of events conducted in college",
      "What events are conducted in college",
      "Are there any event held at college",
      "Events?",
      "functions",
      "what are the events",
      "tell me about events",
      "what about events"
   ],
   "responses": [
      "For event detail visit <a target=\"_blank\" href=\"mru.edu.in\"> here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "document",
   "patterns": [
      "document to bring",
      "documents needed for admision",
      "documents needed at the time of admission",
      "documents needed during admission",
      "documents required for admision",
      "documents required at the time of admission",
      "documents required during admission",
      "What document are required for admission",
      "Which document to bring for admission",
      "documents",
      "what documents do i need",
      "what documents do I need for admission",
      "documents needed"
   ],
   "responses": [
      "To know more about document required visit <a target=\"_blank\" href=\"mru.edu.in\"> here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "floors",
   "patterns": [
      "size of campus",
      "building size",
      "How many floors does college have",
      "floors in college",
      "floors in college",
      "how tall is UNI's College of Engineering college building",
      "floors"
   ],
   "responses": [
      "My College has total 3 floors "
   ],
   "context_set": ""
},
 {
   "tag": "syllabus",
   "patterns": [
      "Syllabus for IT",
      "what is the Information Technology syllabus",
      "syllabus",
      "timetable",
      "what is IT syllabus",
      "syllabus",
      "What is next lecture"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "library",
   "patterns": [
      "is there any library",
      "library facility",
      "library facilities",
      "do you have library",
      "does the college have library facility",
      "college library",
      "where can i get books",
      "book facility",
      "Where is library",
      "Library",
      "Library information",
      "Library books information",
      "Tell me about library",
      "how many libraries"
   ],
   "responses": [
      "There is one huge and spacious library and for more visit <a target=\"blank\" href=\"mru.edu.in\">here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "infrastructure",
   "patterns": [
      "how is college infrastructure",
      "infrastructure",
      "college infrastructure"
   ],
   "responses": [
      "Our University has Excellent Infrastructure. Campus is clean. Good IT Labs With Good Speed of Internet connection"
   ],
   "context_set": ""
},
 {
   "tag": "canteen",
   "patterns": [
      "food facilities",
      "canteen facilities",
      "canteen facility",
      "is there any canteen",
      "Is there a cafetaria in college",
      "Does college have canteen",
      "Where is canteen",
      "where is cafetaria",
      "canteen",
      "Food",
      "Cafetaria"
   ],
   "responses": [
      "Our university has canteen with variety of food available"
   ],
   "context_set": ""
},
 {
   "tag": "menu",
   "patterns": [
      "food menu",
      "food in canteen",
      "Whats there on menu",
      "what is available in college canteen",
      "what foods can we get in college canteen",
      "food variety",
      "What is there to eat?"
   ],
   "responses": [
      "There are a lot of canteens in our college with a variety of options"
   ],
   "context_set": ""
},
 {
   "tag": "placement",
   "patterns": [
      "What is college placement",
      "Which companies visit in college",
      "What is average package",
      "companies visit",
      "package",
      "About placement",
      "placement",
      "recruitment",
      "companies"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "ithod",
   "patterns": [
      "Who is HOD",
      "Where is HOD",
      "it hod",
      "name of it hod"
   ],
   "responses": [
      "HOD CST is Dr. Manpreet Kaur"
   ],
   "context_set": ""
},
 {
   "tag": "computerhod",
   "patterns": [
      "Who is computer HOD",
      "Where is computer HOD",
      "computer hod",
      "name of computer hod"
   ],
   "responses": [
      "HOD CST is Dr. Manpreet Kaur"
   ],
   "context_set": ""
},
 {
   "tag": "extchod",
   "patterns": [
      "Who is extc HOD",
      "Where is  extc HOD",
      "extc hod",
      "name of extc hod"
   ],
   "responses": [
      "Different school wise hod are different.So be more clear with your school or department"
   ],
   "context_set": ""
},
 {
   "tag": "principal",
   "patterns": [
      "what is the name of principal",
      "whatv is the principal name",
      "principal name",
      "Who is college principal",
      "Where is principal's office",
      "principal",
      "name of principal"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "sem",
   "patterns": [
      "exam dates",
      "exam schedule",
      "When is semester exam",
      "Semester exam timetable",
      "sem",
      "semester",
      "exam",
      "when is exam",
      "exam timetable",
      "exam dates",
      "when is semester"
   ],
   "responses": [
      "View Academic calendar for info"
   ],
   "context_set": ""
},
 {
   "tag": "admission",
   "patterns": [
      "what is the process of admission",
      "what is the admission process",
      "How to take admission in your college",
      "What is the process for admission",
      "admission",
      "admission process"
   ],
   "responses": [
      "Application can also be submitted online through the Unversity's  <a target=\"_blank\" href=\"mru.edu.in\">website</a>"
   ],
   "context_set": ""
},
 {
   "tag": "scholarship",
   "patterns": [
      "scholarship",
      "Is scholarship available",
      "scholarship engineering",
      "scholarship it",
      "scholarship ce",
      "scholarship mechanical",
      "scholarship civil",
      "scholarship chemical",
      "scholarship for AI/ML",
      "available scholarships",
      "scholarship for computer engineering",
      "scholarship for IT engineering",
      "scholarship for mechanical engineering",
      "scholarship for civil engineering",
      "scholarship for chemical engineering",
      "list of scholarship",
      "comps scholarship",
      "IT scholarship",
      "mechanical scholarship",
      "civil scholarship",
      "chemical scholarship",
      "automobile scholarship",
      "first year scholarship",
      "second year scholarship",
      "third year scholarship",
      "fourth year scholarship"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "facilities",
   "patterns": [
      "What facilities college provide",
      "College facility",
      "What are college facilities",
      "facilities",
      "facilities provided"
   ],
   "responses": [
      "Our university's Engineering department provides fully AC Lab with internet connection, smart classroom, Auditorium, library,canteen"
   ],
   "context_set": ""
},
 {
   "tag": "college intake",
   "patterns": [
      "max number of students",
      "number of seats per branch",
      "number of seats in each branch",
      "maximum number of seats",
      "maximum students intake",
      "What is college intake",
      "how many stundent are taken in each branch",
      "seat allotment",
      "seats"
   ],
   "responses": [
      "Cant answer that right now."
   ],
   "context_set": ""
},
 {
   "tag": "uniform",
   "patterns": [
      "college dress code",
      "college dresscode",
      "what is the uniform",
      "can we wear casuals",
      "Does college have an uniform",
      "Is there any uniform",
      "uniform",
      "what about uniform",
      "do we have to wear uniform"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "committee",
   "patterns": [
      "what are the different committe in college",
      "different committee in college",
      "Are there any committee in college",
      "Give me committee details",
      "committee",
      "how many committee are there in college"
   ],
   "responses": [
      "Cant answer that right now"
   ],
   "context_set": ""
},
 {
   "tag": "random",
   "patterns": [
      "I love you",
      "Will you marry me",
      "Do you love me"
   ],
   "responses": [
      "I am not program for this, please ask appropriate query"
   ],
   "context_set": ""
},
 {
   "tag": "swear",
   "patterns": [
      "fuck",
      "bitch",
      "shut up",
      "hell",
      "stupid",
      "idiot",
      "dumb ass",
      "asshole",
      "fucker"
   ],
   "responses": [
      "please use appropriate language",
      "Maintaining decency would be appreciated"
   ],
   "context_set": ""
},
 {
   "tag": "vacation",
   "patterns": [
      "holidays",
      "when will semester starts",
      "when will semester end",
      "when is the holidays",
      "list of holidays",
      "Holiday in these year",
      "holiday list",
      "about vacations",
      "about holidays",
      "When is vacation",
      "When is holidays",
      "how long will be the vacation"
   ],
   "responses": [
      "Academic calender is given to you by your class-soordinators after you join your respective classes"
   ],
   "context_set": ""
},
 {
   "tag": "sports",
   "patterns": [
      "sports and games",
      "give sports details",
      "sports infrastructure",
      "sports facilities",
      "information about sports",
      "Sports activities",
      "please provide sports and games information"
   ],
   "responses": [
      "Our university encourages all-round development of students and hence provides sports facilities in the campus. For more details visit<a target=\"_blank\" href=/\"(mru.edu.in)\">here</a>"
   ],
   "context_set": ""
},
 {
   "tag": "salutaion",
   "patterns": [
      "okk",
      "okie",
      "nice work",
      "well done",
      "good job",
      "thanks for the help",
      "Thank You",
      "its ok",
      "Thanks",
      "Good work",
      "k",
      "ok",
      "okay"
   ],
   "responses": [
      "I am glad I helped you",
      "welcome, anything else i can assist you with?"
   ],
   "context_set": ""
},
 {
   "tag": "task",
   "patterns": [
      "what can you do",
      "what are the thing you can do",
      "things you can do",
      "what can u do for me",
      "how u can help me",
      "why i should use you"
   ],
   "responses": [
      "I can answer to low-intermediate questions regarding college",
      "You can ask me questions regarding college, and i will try to answer them"
   ],
   "context_set": ""
},
 {
   "tag": "ragging",
   "patterns": [
      "ragging",
      "is ragging practice active in college",
      "does college have any antiragging facility",
      "is there any ragging cases",
      "is ragging done here",
      "ragging against",
      "antiragging facility",
      "ragging juniors",
      "ragging history",
      "ragging incidents"
   ],
   "responses": [
      "We are Proud to tell you that our college provides ragging free environment, and we have strict rules against ragging"
   ],
   "context_set": ""
},
 {
   "tag": "hod",
   "patterns": [
      "hod",
      "hod name",
      "who is the hod"
   ],
   "responses": [
      "HODs differ for each branch, please be more specific like: (HOD it)"
   ],
   "context_set": ""
}, { "tag": "greeting", "patterns": [ "hi", "hello", "hey", "hola", "hi there", "hello there", "hey there" ], "responses": [ "Hello! How can I assist you today?", "Hi! What's on your mind?", "Hey! Welcome to our college chatbot. How can I help you?" ], "context_set": "" },

{ "tag": "introduction", "patterns": [ "what is this chatbot", "what can you do", "introduce yourself", "who are you" ], "responses": [ "I'm your college chatbot, here to help you with any questions or concerns you may have about our college. I can provide information on various topics, from academics to facilities and more.", "I'm an AI-powered chatbot designed to assist you with any queries related to our college. Feel free to ask me anything!" ], "context_set": "" },

{ "tag": "academics", "patterns": [ "what courses do you offer", "courses available", "programs offered", "what can I study" ], "responses": [ "We offer a wide range of undergraduate and postgraduate programs in fields like Engineering, Management, Arts, and Science. Please visit our website for a detailed list of courses.", "Our college provides various programs in Engineering, Management, Arts, and Science. If you're interested in a specific field, feel free to ask and I'll provide more information." ], "context_set": "" },

{ "tag": "admission", "patterns": [ "admission process", "how to apply", "admission criteria", "eligibility criteria" ], "responses": [ "Our admission process typically starts in the month of April. You can visit our website for detailed information on eligibility criteria, application process, and important dates.", "To apply, please visit our website and fill out the online application form. Make sure to check the eligibility criteria and admission process before applying." ], "context_set": "" },

{ "tag": "facilities", "patterns": [ "what facilities do you have", "facilities available", "library", "hostel", "canteen" ], "responses": [ "We have a range of facilities to support our students, including a well-stocked library, state-of-the-art laboratories, hostel facilities, canteen, and more.", "Our college provides a comfortable and conducive learning environment with facilities like a library, hostel, canteen, and sports facilities." ], "context_set": "" },

{ "tag": "placement", "patterns": [ "placement statistics", "placement record", "job opportunities", "campus placement" ], "responses": [ "Our college has an excellent placement record, with many top companies visiting our campus every year. You can visit our website for detailed placement statistics.", "We have a dedicated placement cell that works closely with top companies to provide job opportunities to our students. Our placement record is impressive, with many students getting placed in reputed companies." ], "context_set": "" },

{ "tag": "location", "patterns": [ "where is the college located", "college location", "address" ], "responses": [ "Our college is located in [insert location]. You can find the exact address and map directions on our website.", "We're situated in [insert location], easily accessible by public transport. If you need more information, feel free to ask." ], "context_set": "" },

{ "tag": "contact", "patterns": [ "contact us", "phone number", "email id", "address" ], "responses": [ "You can reach us at [insert phone number] or email us at [insert email id]. Our address is [insert address].", "Feel free to contact us at [insert phone number] or [insert email id] for any queries or concerns. You can also visit our website for more information." ], "context_set": "" },

{ "tag": "bye", "patterns": [ "goodbye", "bye bye", "see you later" ], "responses": [ "Goodbye! I'm here to help you with any questions you may have about our college. Have a great day!", "Until next time, I'm here to assist you with any questions you may have. Have a great day!" ], "context_set": "" }, { "tag": "fees", "patterns": [ "fees structure", "how much is the fees", "fee details" ], "responses": [ "Our fee structure varies depending on the program and category. Please visit our website for detailed fee information.", "You can find the fee details on our website or contact our admission office for more information." ], "context_set": "" },

{ "tag": "scholarship", "patterns": [ "scholarship available", "do you offer scholarship", "scholarship criteria" ], "responses": [ "Yes, we offer various scholarships to meritorious students. Please visit our website for eligibility criteria and application process.", "We provide scholarships to deserving students based on their academic performance and other criteria. You can check our website for more information." ], "context_set": "" },

{ "tag": "alumni", "patterns": [ "alumni network", "alumni association", "our alumni" ], "responses": [ "Our alumni network is strong and active, with many successful professionals and entrepreneurs. You can connect with them through our alumni association.", "We're proud of our alumni who have made a mark in their respective fields. You can find more information about our alumni association on our website." ], "context_set": "" },

{ "tag": "campus life", "patterns": [ "campus life", "life in college", "student life" ], "responses": [ "Our campus life is vibrant and engaging, with various extracurricular activities and clubs. You can find more information on our website.", "We offer a holistic learning experience, with a focus on academic and personal growth. You can expect a lively and supportive campus environment." ], "context_set": "" },

{ "tag": "transportation", "patterns": [ "transportation facilities", "bus facility", "how to reach college" ], "responses": [ "We provide bus facilities for students and staff, covering various routes. You can find the bus schedule and routes on our website.", "Our college is well-connected by public transport, and we also offer bus facilities for students. You can find more information on our website." ], "context_set": "" },

{ "tag": "hostel", "patterns": [ "hostel facilities", "hostel life", "hostel accommodation" ], "responses": [ "We offer comfortable and secure hostel facilities for our students, with amenities like Wi-Fi, laundry, and mess facilities.", "Our hostel life is supportive and inclusive, with a focus on student welfare and comfort. You can find more information on our website." ], "context_set": "" },

{ "tag": "sports", "patterns": [ "sports facilities", "sports activities", "games in college" ], "responses": [ "We have excellent sports facilities, including playgrounds, courts, and equipment for various sports. You can find more information on our website.", "Our college encourages sports and physical activity, with various sports teams and clubs. You can expect a lively and competitive sports environment." ], "context_set": "" },

{ "tag": "library", "patterns": [ "library facilities", "library timings", "books in library" ], "responses": [ "Our library is well-stocked with a vast collection of books, journals, and online resources. You can find the library timings and facilities on our website.", "We have a state-of-the-art library with a comfortable reading environment, equipped with Wi-Fi and other facilities. You can explore our library catalog online." ], "context_set": "" }, 
{ "tag": "time_management", "patterns": [ "time management", "study schedule", "manage time effectively" ], "responses": [ "Create a study schedule to help you manage your time effectively and stay on track.", "Prioritize your tasks and focus on the most important ones first to make the most of your study time." ], "context_set": "" },

{ "tag": "study_tips", "patterns": [ "study tips", "effective studying", "study habits" ], "responses": [ "Develop good study habits, such as setting goals, creating a study schedule, and reviewing regularly.", "Use active learning techniques, such as summarizing notes in your own words, to retain information better." ], "context_set": "" },

{ "tag": "goal_setting", "patterns": [ "goal setting", "set goals", "achieve goals" ], "responses": [ "Set specific, measurable, and achievable goals for yourself to stay motivated and focused.", "Break down large goals into smaller, manageable tasks to make progress and stay on track." ], "context_set": "" },

{ "tag": "learning_style", "patterns": [ "learning style", "visual learner", "auditory learner" ], "responses": [ "Identify your learning style, whether it's visual, auditory, or kinesthetic, to learn more effectively.", "Experiment with different learning techniques to find what works best for you." ], "context_set": "" },

{ "tag": "motivation", "patterns": [ "stay motivated", "motivation tips", "overcome procrastination" ], "responses": [ "Find your why and remind yourself of it often to stay motivated and focused.", "Break tasks into smaller steps and reward yourself for completing each one to overcome procrastination." ], "context_set": "" },

{ "tag": "organization", "patterns": [ "organization", "study organization", "note taking" ], "responses": [ "Use a planner or digital tool to stay organized and keep track of your assignments and deadlines.", "Develop a note-taking system that works for you, such as the Cornell Notes method." ], "context_set": "" }
]};