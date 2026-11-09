export type Locale = 'th' | 'en';

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    subTagline: string;
    save: string;
    cancel: string;
    delete: string;
    loading: string;
    saving: string;
    points: string;
    pts: string;
    disclaimer: string;
    disclaimerTitle: string;
    getStarted: string;
    signIn: string;
    signOut: string;
    noCreditCard: string;
  };
  nav: {
    home: string;
    meals: string;
    water: string;
    sleep: string;
    quests: string;
    settings: string;
  };
  dashboard: {
    greeting: string;
    snapshot: string;
    aiInsightTitle: string;
    aiInsightWaterLow: string;
    aiInsightGood: string;
    aiDisclaimer: string;
    todaysHabits: string;
    mealsLogged: string;
    logFood: string;
    ofGoal: string;
    latestLog: string;
    dailyQuests: string;
    completed: string;
    lineBannerTitle: string;
    lineBannerDesc: string;
    connect: string;
  };
  hydration: {
    title: string;
    subtitle: string;
    todaysIntake: string;
    goal: string;
    reached: string;
    targetMet: string;
    quickAdd: string;
    customAmount: string;
    add: string;
    todaysLogs: string;
    noLogs: string;
    noLogsHint: string;
  };
  nutrition: {
    title: string;
    subtitle: string;
    addMeal: string;
    recordMeal: string;
    mealType: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    foodName: string;
    foodNamePlaceholder: string;
    portion: string;
    portionPlaceholder: string;
    calories: string;
    todaysMeals: string;
    noMeals: string;
    noMealsHint: string;
  };
  sleep: {
    title: string;
    subtitle: string;
    recordSleep: string;
    latestSleep: string;
    duration: string;
    bedtime: string;
    wakeTime: string;
    slept: string;
    woke: string;
    notes: string;
    notesPlaceholder: string;
    recentLogs: string;
    noLogs: string;
    noLogsHint: string;
    errorWakeBeforeBed: string;
    errorDurationMax: string;
  };
  quests: {
    title: string;
    subtitle: string;
    totalPoints: string;
    activeStatus: string;
    pointsInfo: string;
    todaysQuests: string;
    healthyFirst: string;
    healthyFirstDesc: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profileInfo: string;
    displayName: string;
    timezone: string;
    timezoneHint: string;
    language: string;
    thai: string;
    english: string;
    notifPrefs: string;
    hydrationReminders: string;
    hydrationRemindersDesc: string;
    sleepReminders: string;
    sleepRemindersDesc: string;
    savePrefs: string;
    savedSuccess: string;
    lineTitle: string;
    lineDesc: string;
    lineConnected: string;
    connectLine: string;
  };
  auth: {
    welcomeBack: string;
    createAccount: string;
    startJourney: string;
    email: string;
    password: string;
    passwordMin: string;
    yourName: string;
    namePlaceholder: string;
    signInBtn: string;
    createBtn: string;
    noAccount: string;
    haveAccount: string;
    createOne: string;
    regSuccessTitle: string;
    regSuccessDesc: string;
  };
}

export const translations: Record<Locale, TranslationSchema> = {
  th: {
    common: {
      appName: 'LifeSync',
      tagline: 'ติดตามพฤติกรรม เข้าใจสุขภาพ สร้างชีวิตที่ดีขึ้น',
      subTagline: 'เพื่อนร่วมทางดูแลสุขภาพ 3 ด้าน: อาหาร, ดื่มน้ำ, และการนอนหลับ พร้อมระบบภารกิจและแจ้งเตือนผ่าน LINE',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      delete: 'ลบ',
      loading: 'กำลังโหลด...',
      saving: 'กำลังบันทึก...',
      points: 'คะแนน',
      pts: 'แต้ม',
      disclaimer: 'LifeSync เป็นเว็บแอปเพื่อการดูแลสุขภาพและสร้างวินัยในชีวิตประจำวัน ไม่ใช่เครื่องมือแพทย์และไม่ใช้เพื่อการวินิจฉัยโรค',
      disclaimerTitle: 'ข้อชี้แจงด้านสุขภาพ (Non-medical)',
      getStarted: 'เริ่มต้นใช้งานฟรี',
      signIn: 'เข้าสู่ระบบ',
      signOut: 'ออกจากระบบ',
      noCreditCard: 'ไม่จำเป็นต้องใช้บัตรเครดิต',
    },
    nav: {
      home: 'หน้าหลัก',
      meals: 'อาหาร',
      water: 'ดื่มน้ำ',
      sleep: 'การนอน',
      quests: 'ภารกิจ',
      settings: 'ตั้งค่า',
    },
    dashboard: {
      greeting: 'สวัสดี',
      snapshot: 'ภาพรวมสุขภาพและพฤติกรรมของคุณวันนี้',
      aiInsightTitle: 'ข้อคิดและคำแนะนำประจำวัน (AI Insight)',
      aiInsightWaterLow: 'เริ่มต้นวันด้วยน้ำเปล่า 1 แก้ว ช่วยเติมความสดชื่นและเพิ่มสมาธิในการทำงานได้ดีขึ้น!',
      aiInsightGood: 'ยอดเยี่ยมมาก! คุณดื่มน้ำได้ดีตามเป้าหมาย อย่าลืมเข้านอนให้ตรงเวลาเพื่อการพักผ่อนที่มีคุณภาพนะ',
      aiDisclaimer: '*ข้อสังเกตเพื่อสุขภาพจากข้อมูลที่คุณบันทึก',
      todaysHabits: 'พฤติกรรมวันนี้',
      mealsLogged: 'มื้อ',
      logFood: 'บันทึกอาหาร',
      ofGoal: 'ของเป้าหมาย',
      latestLog: 'บันทึกล่าสุด',
      dailyQuests: 'ภารกิจประจำวัน',
      completed: 'สำเร็จแล้ว',
      lineBannerTitle: 'ไม่พลาดทุกช่วงเวลาสุขภาพ',
      lineBannerDesc: 'เชื่อมต่อกับ LINE Official Account เพื่อรับการแจ้งเตือนดื่มน้ำและการนอนหลับ',
      connect: 'เชื่อมต่อ',
    },
    hydration: {
      title: 'การดื่มน้ำ',
      subtitle: 'ทุกแก้วช่วยเติมความสมดุลและความสดชื่นให้ร่างกาย',
      todaysIntake: 'ปริมาณน้ำวันนี้',
      goal: 'เป้าหมาย',
      reached: 'ทำได้แล้ว',
      targetMet: 'บรรลุเป้าหมายประจำวันแล้ว!',
      quickAdd: 'บันทึกด่วน',
      customAmount: 'ระบุปริมาณเอง (มล.)',
      add: 'เพิ่ม',
      todaysLogs: 'ประวัติการดื่มน้ำวันนี้',
      noLogs: 'ยังไม่มีประวัติดื่มน้ำวันนี้',
      noLogsHint: 'กดปุ่มด้านบนเพื่อบันทึกน้ำแก้วแรกของคุณ!',
    },
    nutrition: {
      title: 'โภชนาการและอาหาร',
      subtitle: 'บันทึกมื้ออาหารอย่างมีสติ เพื่อพลังงานที่ต่อเนื่องตลอดวัน',
      addMeal: 'บันทึกมื้ออาหาร',
      recordMeal: 'บันทึกข้อมูลอาหาร',
      mealType: 'ประเภทมื้อ',
      breakfast: 'มื้อเช้า',
      lunch: 'มื้อเที่ยง',
      dinner: 'มื้อเย็น',
      snack: 'ของว่าง',
      foodName: 'ชื่ออาหาร / เมนู',
      foodNamePlaceholder: 'เช่น ข้าวมันไก่, สลัดอกไก่',
      portion: 'ปริมาณ (ระบุหรือไม่ก็ได้)',
      portionPlaceholder: 'เช่น 1 จาน, 1 ถ้วย',
      calories: 'พลังงานโดยประมาณ (kcal)',
      todaysMeals: 'มื้ออาหารวันนี้',
      noMeals: 'ยังไม่มีบันทึกอาหารสำหรับวันนี้',
      noMealsHint: 'บันทึกอาหารที่คุณรับประทานเพื่อติดตามพลังงานและสารอาหาร!',
    },
    sleep: {
      title: 'การนอนหลับ',
      subtitle: 'พักผ่อนอย่างมีคุณภาพเพื่อฟื้นฟูร่างกายและสมอง',
      recordSleep: 'บันทึกการนอน',
      latestSleep: 'การนอนล่าสุด',
      duration: 'ระยะเวลา',
      bedtime: 'เวลาเข้านอน',
      wakeTime: 'เวลาตื่นนอน',
      slept: 'เข้านอน',
      woke: 'ตื่นนอน',
      notes: 'บันทึกเพิ่มเติม (ไม่บังคับ)',
      notesPlaceholder: 'เช่น ตื่นมารู้สึกสดชื่น, อ่านหนังสือก่อนนอน',
      recentLogs: 'ประวัติการนอนล่าสุด',
      noLogs: 'ยังไม่มีบันทึกการนอน',
      noLogsHint: 'บันทึกเวลาเข้านอนและเวลาตื่นเพื่อดูความสม่ำเสมอของตารางชีวิต!',
      errorWakeBeforeBed: 'เวลาตื่นนอนต้องอยู่หลังเวลาเข้านอน',
      errorDurationMax: 'ระยะเวลานอนไม่สามารถเกิน 24 ชั่วโมงต่อหนึ่งบันทึกได้',
    },
    quests: {
      title: 'รางวัลและภารกิจ',
      subtitle: 'สร้างวินัยและความสม่ำเสมอในแบบที่ทำได้จริง',
      totalPoints: 'คะแนนสุขภาพสะสม',
      activeStatus: 'กำลังสะสม',
      pointsInfo: 'คุณจะได้รับคะแนนอัตโนมัติเมื่อบันทึกอาหาร น้ำดื่ม และเวลานอนในแต่ละวัน',
      todaysQuests: 'ภารกิจวันนี้',
      healthyFirst: 'สุขภาพที่ดีต้องมาก่อนเสมอ',
      healthyFirstDesc: 'LifeSync ให้รางวัลกับความสม่ำเสมอในการบันทึก เราไม่สนับสนุนการอดอาหารรุนแรง การดื่มน้ำมากเกินไป หรือการอดนอนเพื่อทำภารกิจ',
    },
    settings: {
      title: 'ตั้งค่า',
      subtitle: 'ข้อมูลส่วนตัว การเชื่อมต่อ LINE และความเป็นส่วนตัว',
      profileInfo: 'ข้อมูลส่วนตัว',
      displayName: 'ชื่อที่แสดง',
      timezone: 'เขตเวลา (Timezone)',
      timezoneHint: 'ใช้สำหรับคำนวณวันและเวลาแจ้งเตือนที่ตรงกับคุณ',
      language: 'ภาษา (Language)',
      thai: 'ไทย (Thai)',
      english: 'English',
      notifPrefs: 'การแจ้งเตือน',
      hydrationReminders: 'เตือนดื่มน้ำ',
      hydrationRemindersDesc: 'รับการแจ้งเตือนดื่มน้ำเบาๆ ตลอดวัน',
      sleepReminders: 'เตือนเวลาเข้านอน',
      sleepRemindersDesc: 'รับข้อความเตือนให้ผ่อนคลายและเตรียมเข้านอน',
      savePrefs: 'บันทึกการตั้งค่า',
      savedSuccess: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
      lineTitle: 'LINE Official Account',
      lineDesc: 'เชื่อมต่อบัญชีเพื่อรับการเตือนดื่มน้ำและการทักทายยามเช้าผ่านแชท LINE ของคุณ',
      lineConnected: 'เชื่อมต่อกับ LINE เรียบร้อยแล้ว',
      connectLine: 'เชื่อมต่อ LINE',
    },
    auth: {
      welcomeBack: 'ยินดีต้อนรับกลับมา',
      createAccount: 'สร้างบัญชีผู้ใช้งาน',
      startJourney: 'เริ่มต้นเส้นทางการมีสุขภาพที่ดีของคุณตั้งแต่วันนี้',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
      passwordMin: 'อย่างน้อย 6 ตัวอักษร',
      yourName: 'ชื่อของคุณ',
      namePlaceholder: 'เช่น กิตติ, มานี',
      signInBtn: 'เข้าสู่ระบบ',
      createBtn: 'สร้างบัญชี',
      noAccount: 'ยังไม่มีบัญชี?',
      haveAccount: 'มีบัญชีอยู่แล้ว?',
      createOne: 'สมัครสมาชิก',
      regSuccessTitle: 'สมัครสมาชิกเรียบร้อยแล้ว!',
      regSuccessDesc: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตน จากนั้นเข้าสู่ระบบเพื่อเริ่มใช้งาน',
    },
  },
  en: {
    common: {
      appName: 'LifeSync',
      tagline: 'Track your habits. Understand your health. Build a better life.',
      subTagline: 'Your everyday companion across Nutrition, Hydration, and Sleep with gentle quests and LINE reminders.',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
      saving: 'Saving...',
      points: 'Points',
      pts: 'pts',
      disclaimer: 'LifeSync is a wellness and health-education product. It is not a medical device and does not diagnose, treat, or prevent disease.',
      disclaimerTitle: 'Non-Medical Wellness Disclaimer',
      getStarted: 'Get Started Free',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      noCreditCard: 'No credit card required',
    },
    nav: {
      home: 'Home',
      meals: 'Meals',
      water: 'Water',
      sleep: 'Sleep',
      quests: 'Quests',
      settings: 'Settings',
    },
    dashboard: {
      greeting: 'Hello',
      snapshot: 'Here is your wellness snapshot for today',
      aiInsightTitle: 'LifeSync Daily Insight',
      aiInsightWaterLow: 'Starting the day with a glass of water can help maintain energy and focus!',
      aiInsightGood: 'Great job maintaining your hydration today! Remember to keep a balanced sleep schedule tonight.',
      aiDisclaimer: '*Wellness observation based on your recorded habits.',
      todaysHabits: "Today's Habits",
      mealsLogged: 'meals',
      logFood: 'Log food',
      ofGoal: 'of goal',
      latestLog: 'Latest log',
      dailyQuests: 'Daily Quests',
      completed: 'completed',
      lineBannerTitle: 'Never miss a habit',
      lineBannerDesc: 'Connect LINE Official Account for gentle reminders.',
      connect: 'Connect',
    },
    hydration: {
      title: 'Hydration',
      subtitle: 'Every sip counts towards your daily balance',
      todaysIntake: "Today's Intake",
      goal: 'Goal',
      reached: 'reached',
      targetMet: 'Daily Target Met!',
      quickAdd: 'Quick Add Water',
      customAmount: 'Custom amount (ml)',
      add: 'Add',
      todaysLogs: "Today's Logs",
      noLogs: 'No water logged yet today',
      noLogsHint: 'Tap a button above to record your first glass!',
    },
    nutrition: {
      title: 'Nutrition',
      subtitle: 'Mindful food logging for sustainable energy',
      addMeal: 'Add Meal',
      recordMeal: 'Record a Meal',
      mealType: 'Meal Type',
      breakfast: 'breakfast',
      lunch: 'lunch',
      dinner: 'dinner',
      snack: 'snack',
      foodName: 'Food / Dish Name',
      foodNamePlaceholder: 'e.g. Chicken Rice with cucumbers',
      portion: 'Portion (Optional)',
      portionPlaceholder: 'e.g. 1 bowl / 1 plate',
      calories: 'Calories (Est. kcal)',
      todaysMeals: "Today's Meals",
      noMeals: 'No meals logged yet today',
      noMealsHint: 'Keep track of your fuel by recording your first meal!',
    },
    sleep: {
      title: 'Sleep Routine',
      subtitle: 'Rest well to restore your body and mind',
      recordSleep: 'Record Sleep',
      latestSleep: 'Latest Sleep',
      duration: 'duration',
      bedtime: 'Bedtime',
      wakeTime: 'Wake-up Time',
      slept: 'Slept',
      woke: 'Woke',
      notes: 'Notes (Optional)',
      notesPlaceholder: 'e.g. Felt restful, read before bed',
      recentLogs: 'Recent Sleep Records',
      noLogs: 'No sleep records yet',
      noLogsHint: 'Record when you slept and woke up to observe your consistency!',
      errorWakeBeforeBed: 'Wake time must be after bedtime.',
      errorDurationMax: 'Sleep duration cannot exceed 24 hours in a single log.',
    },
    quests: {
      title: 'Life Rewards',
      subtitle: 'Celebrate daily consistency, not perfection',
      totalPoints: 'Total Life Points',
      activeStatus: 'Active',
      pointsInfo: 'Points are awarded automatically as you record your meals, hydration, and sleep routines each day.',
      todaysQuests: "Today's Quests",
      healthyFirst: 'Healthy Habits First',
      healthyFirstDesc: 'LifeSync rewards consistent logging and healthy lifestyle self-awareness. We never incentivize restrictive eating, excessive water intake, or lost sleep.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Preferences, LINE account, and privacy',
      profileInfo: 'Profile Information',
      displayName: 'Display Name',
      timezone: 'Timezone',
      timezoneHint: 'Used for accurate daily summaries and quiet hours.',
      language: 'Language',
      thai: 'ไทย (Thai)',
      english: 'English',
      notifPrefs: 'Notification Preferences',
      hydrationReminders: 'Hydration Reminders',
      hydrationRemindersDesc: 'Periodic gentle nudges to drink water',
      sleepReminders: 'Sleep Routine Nudges',
      sleepRemindersDesc: 'Wind-down reminder before bedtime',
      savePrefs: 'Save Preferences',
      savedSuccess: 'Your settings have been saved successfully.',
      lineTitle: 'LINE Official Account',
      lineDesc: 'Link your account to receive water reminders and morning sleep check-ins straight to your LINE chat.',
      lineConnected: 'Connected to LINE',
      connectLine: 'Connect with LINE',
    },
    auth: {
      welcomeBack: 'Welcome back',
      createAccount: 'Create your account',
      startJourney: 'Start your personalized wellness journey today',
      email: 'Email address',
      password: 'Password',
      passwordMin: 'At least 6 characters',
      yourName: 'Your Name',
      namePlaceholder: 'Alex',
      signInBtn: 'Sign In',
      createBtn: 'Create Account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      createOne: 'Create one now',
      regSuccessTitle: 'Registration Successful!',
      regSuccessDesc: 'Check your email inbox to verify your account, then sign in to start tracking.',
    },
  },
};
