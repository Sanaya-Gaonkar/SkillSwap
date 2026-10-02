const bcrypt = require('bcryptjs');
const { db, initDb } = require('../database/db');

async function seed() {
  console.log('--- Initializing database schema ---');
  await initDb();

  console.log('--- Cleaning previous data ---');
  await db.execAsync(`
    DELETE FROM reports;
    DELETE FROM notifications;
    DELETE FROM learning_history;
    DELETE FROM reviews;
    DELETE FROM sessions;
    DELETE FROM skill_exchanges;
    DELETE FROM skill_matches;
    DELETE FROM messages;
    DELETE FROM connections;
    DELETE FROM user_skills;
    DELETE FROM skills;
    DELETE FROM profiles;
    DELETE FROM admins;
    DELETE FROM users;
  `);

  console.log('--- Seeding Skills ---');
  const skillsList = [
    // Programming
    { name: 'Python', category: 'Programming', description: 'Core Python, scripting, libraries, and backend development' },
    { name: 'Java', category: 'Programming', description: 'Object-oriented programming, Spring, and enterprise architecture' },
    { name: 'C++', category: 'Programming', description: 'Systems programming, memory management, and data structures' },
    { name: 'JavaScript', category: 'Programming', description: 'ES6+, async programming, and modern JS runtime basics' },
    { name: 'SQL', category: 'Programming', description: 'Relational queries, schema design, joins, and indexing' },
    { name: 'R', category: 'Programming', description: 'Statistical programming, data manipulation, and visualization' },
    { name: 'Algorithmic Problem Solving', category: 'Programming', description: 'LeetCode, data structures, and algorithmic complexity' },

    // Web
    { name: 'HTML', category: 'Web', description: 'Semantic markup, accessibility, and modern HTML5 APIs' },
    { name: 'CSS', category: 'Web', description: 'Flexbox, Grid, responsive layouts, animations, and CSS variables' },
    { name: 'Web Development', category: 'Web', description: 'Full-stack web fundamentals, REST APIs, and modern toolchains' },
    { name: 'Web Scraping', category: 'Web', description: 'BeautifulSoup, Selenium, automated data collection, and parsing' },

    // Design
    { name: 'UI/UX', category: 'Design', description: 'User experience research, wireframing, and interaction design' },
    { name: 'Figma', category: 'Design', description: 'Component libraries, auto-layout, prototyping, and design systems' },
    { name: 'Graphic Design', category: 'Design', description: 'Visual hierarchy, typography, color palettes, and composition' },
    { name: 'Photoshop', category: 'Design', description: 'Photo editing, image manipulation, and visual mockups' },
    { name: 'Illustrator', category: 'Design', description: 'Vector art, logo creation, iconography, and print design' },
    { name: 'Visual Branding', category: 'Design', description: 'Brand identity guidelines, tone, aesthetic consistency, and logos' },
    { name: 'Pitch Deck Design', category: 'Design', description: 'Investor presentation formatting, slide storytelling, and visual clarity' },

    // Business
    { name: 'Public Speaking', category: 'Business', description: 'Stage presence, vocal delivery, structure, and audience engagement' },
    { name: 'Business Presentation', category: 'Business', description: 'Professional deck structuring and corporate pitching' },
    { name: 'Financial Modelling', category: 'Business', description: 'Discounted cash flows, financial statements, and valuation models' },
    { name: 'Social Media Strategy', category: 'Business', description: 'Content planning, engagement analytics, and social campaigns' },

    // Other
    { name: 'Academic Writing', category: 'Other', description: 'Research papers, thesis structuring, citations, and critical reviews' },
    { name: 'Spanish', category: 'Other', description: 'Conversational Spanish, grammar drills, and vocabulary' },
    { name: 'Video Editing', category: 'Other', description: 'Premiere Pro editing, pacing, cuts, audio leveling, and color correction' },
    { name: 'Git/GitHub', category: 'Other', description: 'Branching strategies, pull requests, merge conflict resolution' },
    { name: 'Excel', category: 'Other', description: 'Advanced formulas, Pivot Tables, VLOOKUP/XLOOKUP, and dashboards' }
  ];

  const skillMap = {};
  for (const s of skillsList) {
    const res = await db.runAsync(
      'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
      [s.name, s.category, s.description]
    );
    skillMap[s.name] = res.lastID;
  }

  console.log('--- Seeding Users and Profiles ---');
  const studentPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin12', 10);

  const usersData = [
    {
      name: 'Ashwet Pilankar',
      email: 'ashwet@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'IT Engineering',
      year: '4th Year',
      bio: 'Student interested in technology and design. Love building web apps and exchanging knowledge!',
      interests: 'Web development, UI design, open source, entrepreneurship',
      availability: 'Weekdays after 5 PM, Weekends flexible',
      learningMode: 'Hands-on projects, peer-programming, screen share',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ashwet',
      teach: ['Python', 'Java', 'Web Development'],
      learn: ['UI/UX', 'Figma', 'Graphic Design']
    },
    {
      name: 'Priya Sharma',
      email: 'priya@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'Design & Applied Arts',
      year: '3rd Year',
      bio: 'Visual artist and aspiring UI designer. Excited to swap design tips for coding guidance!',
      interests: 'Branding, typography, illustrations, web development',
      availability: 'Flexible evenings, Sunday afternoons',
      learningMode: 'Portfolio critique, guided coding, 1-on-1 walkthroughs',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Priya',
      teach: ['Graphic Design', 'UI/UX', 'Visual Branding'],
      learn: ['Python', 'Web Development']
    },
    {
      name: 'Rahul Patil',
      email: 'rahul@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'Computer Applications',
      year: '2nd Year',
      bio: 'Web frontend enthusiast. Looking for a buddy to practice Java backend development and advanced Figma.',
      interests: 'Frontend web, interactive UI, Java backend',
      availability: 'Weekends all day, Mon/Wed nights',
      learningMode: 'Screen share coding, pair programming',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul',
      teach: ['UI/UX', 'Web Development', 'HTML', 'CSS'],
      learn: ['Java', 'Figma']
    },
    {
      name: 'Rohan Mehta',
      email: 'rohan@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'Computer Science',
      year: '3rd Year',
      bio: '3rd-year CS student aiming to build full-stack web products and launch a tech startup. Looking to improve design skills!',
      interests: 'Startups, full-stack, algorithm puzzles, product design',
      availability: 'Weekdays 6-8 PM, Saturdays',
      learningMode: 'Interactive sessions, project-based learning, screen sharing',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
      teach: ['Python', 'Git/GitHub', 'SQL', 'Algorithmic Problem Solving'],
      learn: ['UI/UX', 'Figma', 'Visual Branding', 'Pitch Deck Design']
    },
    {
      name: 'Ananya Sen',
      email: 'ananya@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'Media & Graphic Communication',
      year: '2nd Year',
      bio: '2nd-year Media student passionate about visual storytelling. Eager to learn Python for marketing automation and data gathering!',
      interests: 'Social media, video production, digital marketing, automation',
      availability: 'Mon/Wed/Fri afternoons',
      learningMode: 'Casual 1-on-1 calls, step-by-step code walkthroughs',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ananya',
      teach: ['Graphic Design', 'Photoshop', 'Illustrator', 'Social Media Strategy', 'Video Editing'],
      learn: ['Python', 'Web Scraping', 'Excel']
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@skillswap.edu',
      password: studentPassword,
      role: 'Student',
      course: 'Economics',
      year: 'Final Year',
      bio: 'Final-year Economics major preparing for management consulting interviews and global graduate programs.',
      interests: 'Macroeconomics, financial models, consulting case studies',
      availability: 'Tuesdays & Thursdays evenings, Weekends',
      learningMode: 'Weekly recurring voice/video exchange, bilingual drills',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus',
      teach: ['Academic Writing', 'Financial Modelling', 'Excel', 'R'],
      learn: ['Spanish', 'Public Speaking', 'Business Presentation']
    },
    {
      name: 'admin',
      email: 'admin@skillswap.edu',
      password: adminPassword,
      role: 'Admin',
      course: 'Administration',
      year: 'Staff',
      bio: 'Platform Administrator overseeing community guidelines, moderation, and skill catalog.',
      interests: 'Community moderation, education systems, platform security',
      availability: 'Regular campus hours',
      learningMode: 'System management',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
      teach: [],
      learn: []
    }
  ];

  const userMap = {};
  for (const u of usersData) {
    const res = await db.runAsync(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [u.name, u.email, u.password, u.role, 'active']
    );
    const userId = res.lastID;
    userMap[u.name] = userId;

    await db.runAsync(
      `INSERT INTO profiles (user_id, avatar, course, year, bio, interests, availability, learning_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, u.avatar, u.course, u.year, u.bio, u.interests, u.availability, u.learningMode]
    );

    if (u.role === 'Admin') {
      await db.runAsync('INSERT INTO admins (user_id, name, email) VALUES (?, ?, ?)', [
        userId,
        u.name,
        u.email
      ]);
    }

    // Insert user skills
    for (const sName of u.teach) {
      if (skillMap[sName]) {
        await db.runAsync(
          'INSERT INTO user_skills (user_id, skill_id, type, proficiency) VALUES (?, ?, "teach", "Advanced")',
          [userId, skillMap[sName]]
        );
      }
    }

    for (const sName of u.learn) {
      if (skillMap[sName]) {
        await db.runAsync(
          'INSERT INTO user_skills (user_id, skill_id, type, proficiency) VALUES (?, ?, "learn", "Beginner")',
          [userId, skillMap[sName]]
        );
      }
    }
  }

  console.log('--- Seeding Connections ---');
  // Ashwet <-> Priya (accepted)
  await db.runAsync(
    'INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, "accepted")',
    [userMap['Ashwet Pilankar'], userMap['Priya Sharma']]
  );

  // Ashwet <-> Rahul (accepted)
  await db.runAsync(
    'INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, "accepted")',
    [userMap['Rahul Patil'], userMap['Ashwet Pilankar']]
  );

  // Ashwet <-> Rohan (pending request from Rohan to Ashwet)
  await db.runAsync(
    'INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, "pending")',
    [userMap['Rohan Mehta'], userMap['Ashwet Pilankar']]
  );

  // Rohan <-> Ananya (accepted)
  await db.runAsync(
    'INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, "accepted")',
    [userMap['Rohan Mehta'], userMap['Ananya Sen']]
  );

  // Marcus <-> Ashwet (accepted)
  await db.runAsync(
    'INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, "accepted")',
    [userMap['Marcus Vance'], userMap['Ashwet Pilankar']]
  );

  console.log('--- Seeding Messages ---');
  const ashwetId = userMap['Ashwet Pilankar'];
  const priyaId = userMap['Priya Sharma'];
  const rahulId = userMap['Rahul Patil'];
  const rohanId = userMap['Rohan Mehta'];
  const ananyaId = userMap['Ananya Sen'];

  const messagesList = [
    { sender: priyaId, receiver: ashwetId, content: 'Hey Ashwet! I saw you know Python and want to learn Graphic Design. Are you up for a skill swap?' },
    { sender: ashwetId, receiver: priyaId, content: 'Hi Priya! Absolutely, that sounds awesome. I can teach you Python basics, loops, and data structures.' },
    { sender: priyaId, receiver: ashwetId, content: 'Perfect! I can walk you through typography, color harmony, and visual hierarchy for your web apps.' },
    { sender: ashwetId, receiver: priyaId, content: 'Sounds like a great plan. Let me propose the exchange in SkillSwap!' },
    { sender: rahulId, receiver: ashwetId, content: 'Hey Ashwet, saw your Java skills! Looking forward to swapping UI/UX tips for Java Spring backend.' },
    { sender: ashwetId, receiver: rahulId, content: 'Hey Rahul, let us set up a weekend session! I will help you with OOP and Java syntax.' },
    { sender: rohanId, receiver: ananyaId, content: 'Hey Ananya, I can help you automate your web scraping in Python if you can teach me video editing tips.' },
    { sender: ananyaId, receiver: rohanId, content: 'That would be so helpful! I have repetitive data entry tasks I want to automate with Python.' }
  ];

  for (const m of messagesList) {
    await db.runAsync(
      'INSERT INTO messages (sender_id, receiver_id, content, sent_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [m.sender, m.receiver, m.content]
    );
  }

  console.log('--- Seeding Skill Exchanges & Sessions ---');
  // Exchange 1: Ashwet & Priya (Completed)
  // Ashwet teaches Python, Priya teaches Graphic Design
  const ex1 = await db.runAsync(
    `INSERT INTO skill_exchanges (proposer_id, receiver_id, offered_skill_id, requested_skill_id, notes, status)
     VALUES (?, ?, ?, ?, 'Mutual 2-way skill swap: Python programming for Graphic Design fundamentals', 'completed')`,
    [ashwetId, priyaId, skillMap['Python'], skillMap['Graphic Design']]
  );
  const ex1Id = ex1.lastID;

  // Session 1 (completed)
  await db.runAsync(
    `INSERT INTO sessions (exchange_id, scheduled_at, mode, location_or_link, notes, status)
     VALUES (?, '2026-09-12 18:00:00', 'Online', 'https://meet.google.com/abc-swap-xyz', 'Python variables, functions & Graphic Design color palettes', 'completed')`,
    [ex1Id]
  );

  // Reviews for Exchange 1
  await db.runAsync(
    `INSERT INTO reviews (exchange_id, reviewer_id, reviewed_user_id, rating, comment)
     VALUES (?, ?, ?, 5, 'Ashwet explained Python variables and loops so clearly with practical exercises! Great learning session.')`,
    [ex1Id, priyaId, ashwetId]
  );

  await db.runAsync(
    `INSERT INTO reviews (exchange_id, reviewer_id, reviewed_user_id, rating, comment)
     VALUES (?, ?, ?, 5, 'Priya gave me incredible feedback on my color palette and typography hierarchy. Super recommended!')`,
    [ex1Id, ashwetId, priyaId]
  );

  // Learning History for Exchange 1
  await db.runAsync(
    `INSERT INTO learning_history (user_id, skill_id, exchange_id, partner_id, learned_on, rating)
     VALUES (?, ?, ?, ?, '2026-09-15', 5)`,
    [ashwetId, skillMap['Graphic Design'], ex1Id, priyaId]
  );

  await db.runAsync(
    `INSERT INTO learning_history (user_id, skill_id, exchange_id, partner_id, learned_on, rating)
     VALUES (?, ?, ?, ?, '2026-09-12', 5)`,
    [priyaId, skillMap['Python'], ex1Id, ashwetId]
  );

  // Exchange 2: Ashwet & Rahul (Accepted - Active)
  // Rahul offers UI/UX, requests Java
  const ex2 = await db.runAsync(
    `INSERT INTO skill_exchanges (proposer_id, receiver_id, offered_skill_id, requested_skill_id, notes, status)
     VALUES (?, ?, ?, ?, 'Swap Web Dev & Java backend coaching for UI/UX wireframing mentorship', 'accepted')`,
    [rahulId, ashwetId, skillMap['UI/UX'], skillMap['Java']]
  );
  const ex2Id = ex2.lastID;

  // Session 2 (scheduled)
  await db.runAsync(
    `INSERT INTO sessions (exchange_id, scheduled_at, mode, location_or_link, notes, status)
     VALUES (?, '2026-10-04 15:00:00', 'Online', 'https://meet.google.com/rahul-ashwet-swap', 'Java OOP concepts & Figma auto-layout walkthrough', 'scheduled')`,
    [ex2Id]
  );

  // Exchange 3: Rohan & Ananya (Proposed)
  await db.runAsync(
    `INSERT INTO skill_exchanges (proposer_id, receiver_id, offered_skill_id, requested_skill_id, notes, status)
     VALUES (?, ?, ?, ?, 'Python scraping script in exchange for Premiere Pro video cuts walkthrough', 'proposed')`,
    [rohanId, ananyaId, skillMap['Python'], skillMap['Video Editing']]
  );

  console.log('--- Seeding Notifications ---');
  await db.runAsync(
    `INSERT INTO notifications (user_id, message, type, link, is_read)
     VALUES (?, 'Rohan Mehta sent you a connection request.', 'connection_request', '/connections', 0)`,
    [ashwetId]
  );

  await db.runAsync(
    `INSERT INTO notifications (user_id, message, type, link, is_read)
     VALUES (?, 'Priya Sharma accepted your skill exchange proposal!', 'exchange_accepted', '/exchanges/${ex1Id}', 1)`,
    [ashwetId]
  );

  await db.runAsync(
    `INSERT INTO notifications (user_id, message, type, link, is_read)
     VALUES (?, 'Session scheduled with Rahul Patil on 4th October 2026 at 3:00 PM.', 'session_scheduled', '/sessions', 0)`,
    [ashwetId]
  );

  await db.runAsync(
    `INSERT INTO notifications (user_id, message, type, link, is_read)
     VALUES (?, 'Priya left you a 5-star review! Check it out on your profile.', 'review', '/profile/${ashwetId}', 1)`,
    [ashwetId]
  );

  console.log('--- Seeding Reports ---');
  const adminId = userMap['Admin User'];
  await db.runAsync(
    `INSERT INTO reports (reported_by, reported_user_id, reason, description, status)
     VALUES (?, ?, 'Inappropriate language during chat', 'User used inappropriate slang when discussing session timing.', 'open')`,
    [priyaId, rohanId]
  );

  await db.runAsync(
    `INSERT INTO reports (reported_by, reported_user_id, reason, description, status, resolved_at)
     VALUES (?, ?, 'Missed scheduled session', 'Partner did not show up to scheduled call without prior notice.', 'resolved', CURRENT_TIMESTAMP)`,
    [rahulId, rohanId]
  );

  console.log('=== Database seeded successfully with interconnected demo data! ===');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
