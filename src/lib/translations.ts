export type Language = 'en' | 'zh';

export const translations = {
  // Common
  common: {
    signIn: { en: 'Sign In', zh: '登录' },
    signUp: { en: 'Sign Up', zh: '注册' },
    close: { en: 'Close', zh: '关闭' },
    cancel: { en: 'Cancel', zh: '取消' },
    loading: { en: 'Loading...', zh: '加载中...' },
    submit: { en: 'Submit', zh: '提交' },
    register: { en: 'Register', zh: '报名' },
    registered: { en: 'Registered', zh: '已报名' },
    volunteer: { en: 'Volunteer', zh: '志愿者' },
    backToCalendar: { en: '← Back to Calendar', zh: '← 返回日历' },
    welcome: { en: 'Welcome', zh: '欢迎' },
    required: { en: 'Required', zh: '必填' },
    spots: { en: 'spots', zh: '名额' },
    spot: { en: 'spot', zh: '名额' },
    remaining: { en: 'remaining', zh: '剩余' },
    full: { en: 'Full', zh: '已满' },
    all: { en: 'All', zh: '所有' },
    show: { en: 'Show', zh: '显示' },
    language: { en: 'Language', zh: '语言' },
    english: { en: 'English', zh: 'English' },
    chinese: { en: '中文', zh: '中文' },
    or: { en: 'or', zh: '或' },
  },

  // Main page (user portal)
  userPortal: {
    calendar: { en: 'Calendar', zh: '日历' },
    list: { en: 'List', zh: '列表' },
    multiSelect: { en: 'Multi-Select', zh: '多选' },
    cancelMultiSelect: { en: 'Cancel Multi-Select', zh: '取消多选' },
    volunteerPortal: { en: 'Volunteer Portal', zh: '志愿者门户' },
    staffLogin: { en: 'Staff Login', zh: '员工登录' },
    signInPrompt: { en: 'Please sign in to register for events.', zh: '请登录以报名参加活动。' },
    createAccount: { en: 'Create an Account', zh: '创建账户' },
    eventsSelected: { en: 'event(s) selected', zh: '个活动已选择' },
    clickToRegister: { en: 'Click "Register for Selected Events" to sign up for all at once', zh: '点击"报名选中活动"一次性报名所有活动' },
    registerSelected: { en: 'Register for Selected Events', zh: '报名选中活动' },
    multiSelectMode: { en: 'Multi-Select Mode', zh: '多选模式' },
    multiSelectHint: { en: 'Click on events in the calendar to select multiple events for registration.', zh: '在日历中点击活动以选择多个活动进行报名。' },
    loadingEvents: { en: 'Loading events...', zh: '正在加载活动...' },
    footerCopyright: { en: '© 2026 MINDS Singapore. Movement for the Intellectually Disabled of Singapore.', zh: '© 2026 MINDS新加坡。新加坡智障人士运动协会。' },
    footerContact: { en: 'For enquiries, contact us at', zh: '如有疑问，请联系我们：' },
  },

  // Volunteer portal
  volunteerPortal: {
    title: { en: 'MINDS Volunteer Portal', zh: 'MINDS志愿者门户' },
    subtitle: { en: "Make a difference in someone's life", zh: '改变他人的生活' },
    welcomeTitle: { en: 'Welcome to MINDS Volunteer Portal!', zh: '欢迎来到MINDS志愿者门户！' },
    welcomeText: { en: 'Thank you for your interest in volunteering with MINDS Singapore. Our volunteers play a crucial role in supporting people with intellectual disabilities and their families.', zh: '感谢您对MINDS新加坡志愿服务的关注。我们的志愿者在支持智障人士及其家庭方面发挥着重要作用。' },
    step1Title: { en: '1. Sign Up', zh: '1. 注册' },
    step1Text: { en: 'Create your volunteer account', zh: '创建您的志愿者账户' },
    step2Title: { en: '2. Browse Events', zh: '2. 浏览活动' },
    step2Text: { en: 'Find events that match your interests and schedule', zh: '寻找符合您兴趣和时间安排的活动' },
    step3Title: { en: '3. Volunteer', zh: '3. 志愿服务' },
    step3Text: { en: 'Register for events and make a difference', zh: '报名参加活动，做出改变' },
    needsVolunteers: { en: 'Needs Volunteers', zh: '需要志愿者' },
    allEvents: { en: 'All Events', zh: '所有活动' },
    eventsNeedingVolunteers: { en: 'Events Needing Volunteers', zh: '需要志愿者的活动' },
    allUpcomingEvents: { en: 'All Upcoming Events', zh: '所有即将举行的活动' },
    noEventsFound: { en: 'No events found.', zh: '未找到活动。' },
    volunteerSpotsLeft: { en: 'volunteer spots left', zh: '志愿者名额剩余' },
    fullyStaffed: { en: 'Fully staffed', zh: '志愿者已满' },
    volunteers: { en: 'volunteers', zh: '志愿者' },
    signInToVolunteer: { en: 'Sign in to Volunteer', zh: '登录以成为志愿者' },
    volunteerSuccess: { en: 'Successfully registered as a volunteer!', zh: '成功注册为志愿者！' },
    notWheelchairAccessible: { en: 'Not wheelchair accessible', zh: '无障碍设施不可用' },
  },

  // Sign up modal
  signUpModal: {
    eventRegistration: { en: 'Event Registration', zh: '活动报名' },
    bulkEventRegistration: { en: 'Bulk Event Registration', zh: '批量活动报名' },
    registeringFor: { en: 'Registering for', zh: '正在报名' },
    events: { en: 'events', zh: '个活动' },
    allEventsUseSameDetails: { en: 'All events will use the same registration details below.', zh: '所有活动将使用以下相同的报名信息。' },
    
    // Success states
    registrationSuccessful: { en: 'Registration Successful!', zh: '报名成功！' },
    allRegistrationsSuccessful: { en: 'All Registrations Successful!', zh: '所有报名成功！' },
    registrationFailed: { en: 'Registration Failed', zh: '报名失败' },
    partialSuccess: { en: 'Partial Registration Success', zh: '部分报名成功' },
    eventsRegisteredSuccessfully: { en: 'events registered successfully.', zh: '个活动报名成功。' },
    registeredFor: { en: 'You have been registered for', zh: '您已成功报名' },
    registeredSuccessfully: { en: 'Registered successfully', zh: '报名成功' },
    confirmationSent: { en: 'Confirmation sent:', zh: '确认信息已发送：' },
    emailConfirmation: { en: 'Email confirmation sent to your email', zh: '确认邮件已发送至您的邮箱' },
    smsReminder: { en: 'SMS reminder with event details sent to your phone', zh: '活动详情短信提醒已发送至您的手机' },
    
    // Error states
    alreadyRegistered: { en: 'Already Registered', zh: '已报名' },
    alreadyRegisteredDesc: { en: 'You have already signed up for this event. Check "My Events" to view your registrations.', zh: '您已报名此活动。请查看"我的活动"以查看您的报名记录。' },
    scheduleConflict: { en: 'Schedule Conflict', zh: '时间冲突' },
    weeklyLimitReached: { en: 'Weekly Limit Reached', zh: '已达每周限制' },
    eventFull: { en: 'Event Full', zh: '活动已满' },
    eventFullDesc: { en: 'This event has reached maximum capacity. You can join the waitlist if available.', zh: '此活动已达最大容量。如有候补名单，您可以加入候补。' },
    volunteerSpotsFilled: { en: 'Volunteer Spots Filled', zh: '志愿者名额已满' },
    volunteerSpotsFilledDesc: { en: 'All volunteer positions for this event have been filled. Thank you for your interest!', zh: '此活动的所有志愿者名额已满。感谢您的关注！' },
    registrationFailedGeneric: { en: 'Registration Failed', zh: '报名失败' },
    unexpectedError: { en: 'An unexpected error occurred. Please try again later.', zh: '发生意外错误。请稍后重试。' },
    
    // Event details
    wheelchairAccessible: { en: 'Wheelchair Accessible', zh: '无障碍设施' },
    caregiverRequired: { en: 'Caregiver Required', zh: '需要护理人员' },
    caregiverFee: { en: 'Caregiver Fee', zh: '护理人员费用' },
    age: { en: 'Age', zh: '年龄' },
    recurringEvent: { en: 'Recurring Event', zh: '定期活动' },
    allLevels: { en: 'All Levels', zh: '所有级别' },
    spotsRemaining: { en: 'spots remaining', zh: '名额剩余' },
    spotRemaining: { en: 'spot remaining', zh: '名额剩余' },
    joinWaitlist: { en: 'Event is full - Join waitlist', zh: '活动已满 - 加入候补' },
    peopleOnWaitlist: { en: 'people on waitlist', zh: '人在候补名单上' },
    personOnWaitlist: { en: 'person on waitlist', zh: '人在候补名单上' },
    
    // Waitlist notice
    waitlistNoticeTitle: { en: 'Event is Full - Request Waitlist', zh: '活动已满 - 申请候补' },
    waitlistNoticeText: { en: "This event has reached capacity. By submitting this form, you'll submit a waitlist request. Staff will review requests and add selected participants to the waitlist. You'll be contacted if approved and when a spot becomes available.", zh: '此活动已达容量上限。提交此表格即为申请候补。工作人员将审核申请并将选定的参与者添加到候补名单。如获批准或有名额空出，我们将与您联系。' },
    waitlistRequests: { en: 'There are currently', zh: '目前有' },
    waitlistRequestsSuffix: { en: 'waitlist requests.', zh: '个候补申请。' },
    
    // Form fields
    iAmCaregiver: { en: 'I am a caregiver registering on behalf of someone under my care', zh: '我是护理人员，代表我照顾的人报名' },
    participantName: { en: 'Name of Person Under Your Care', zh: '您照顾的人的姓名' },
    participantNameHint: { en: 'This is the name that will appear in staff reports.', zh: '此姓名将出现在员工报告中。' },
    enterParticipantName: { en: "Enter participant's name", zh: '输入参与者姓名' },
    caregiverName: { en: 'Caregiver Name', zh: '护理人员姓名' },
    fullName: { en: 'Full Name', zh: '姓名' },
    nameLinkedToAccount: { en: 'Name is linked to your account.', zh: '姓名与您的账户关联。' },
    phoneNumber: { en: 'Phone Number', zh: '电话号码' },
    enterPhoneNumber: { en: 'Enter your phone number', zh: '输入您的电话号码' },
    emailAddress: { en: 'Email Address', zh: '电子邮箱' },
    emailLinkedToAccount: { en: 'Email is linked to your account.', zh: '邮箱与您的账户关联。' },
    wheelchairAccessNeeded: { en: 'I require wheelchair accessibility', zh: '我需要无障碍设施' },
    caregiverAccompanying: { en: 'Caregiver will be accompanying', zh: '护理人员将陪同' },
    caregiverFullName: { en: "Caregiver's full name", zh: '护理人员全名' },
    caregiverPhone: { en: 'Caregiver Phone', zh: '护理人员电话' },
    caregiverPhoneNumber: { en: "Caregiver's phone number", zh: '护理人员电话号码' },
    caregiverFeePayable: { en: 'Caregiver fee:', zh: '护理人员费用：' },
    payableOnArrival: { en: '- payable on arrival', zh: '- 到场时支付' },
    paymentRequired: { en: 'Payment Required:', zh: '需要付款：' },
    caregiverFeePayableOnArrival: { en: 'is payable on arrival.', zh: '到场时支付。' },
    dietaryRequirements: { en: 'Dietary Requirements', zh: '饮食要求' },
    dietaryPlaceholder: { en: 'e.g., Vegetarian, Halal, No nuts', zh: '例如：素食、清真、无坚果' },
    specialNeeds: { en: 'Special Needs / Additional Requirements', zh: '特殊需求/其他要求' },
    specialNeedsPlaceholder: { en: 'Please let us know if you have any special requirements', zh: '请告知我们您是否有任何特殊需求' },
    submitting: { en: 'Submitting...', zh: '提交中...' },
    registerForEvents: { en: 'Register for', zh: '报名' },
    requestWaitlist: { en: 'Request Waitlist', zh: '申请候补' },
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(
  section: keyof typeof translations,
  key: string,
  lang: Language
): string {
  const sectionData = translations[section] as Record<string, { en: string; zh: string }>;
  return sectionData[key]?.[lang] || sectionData[key]?.en || key;
}
