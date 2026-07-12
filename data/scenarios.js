export const scenarios = [
  {
    id: "ramen",
    name: "Ramen Shop",
    category: "Food & Shopping",
    description:
      "A customer has entered a ramen shop in Japan. Respond naturally as the waiter. Help them find a seat, order, ask questions, make simple requests, and pay when relevant.",
    role: "a friendly ramen shop waiter",
    opening: "いらっしゃいませ。何名様ですか？",
    shortGoal:
      "Practice entering a ramen shop, ordering food, asking questions, and paying politely.",
    goals: [
      "Respond about the number of people",
      "Ask for a recommendation",
      "Order food",
      "Ask for water or another request",
      "Pay politely"
    ],
    usefulPhrases: [
      "すみません",
      "おすすめは何ですか？",
      "ラーメンを一つください",
      "お水をください",
      "お会計お願いします"
    ],
    estimatedTime: "3–5 minutes",
    jp: "ラーメン屋",
    icon: "Bowl",
    next: "cafe",
    politenessMode: "Polite",
    registerLabel: "Polite service Japanese",
    scene: {
      image: null,
      alt: "Ramen shop counter practice scene",
      hotspots: [
        {
          id: "menu",
          label: "メニュー",
          reading: "メニュー",
          romaji: "menyuu",
          english: "menu",
          phrase: "メニューをお願いします。",
          phraseRomaji: "Menyuu o onegaishimasu.",
          phraseEnglish: "The menu, please.",
          x: 22,
          y: 34
        },
        {
          id: "water",
          label: "お水",
          reading: "おみず",
          romaji: "omizu",
          english: "water",
          phrase: "お水をお願いします。",
          phraseRomaji: "Omizu o onegaishimasu.",
          phraseEnglish: "Water, please.",
          x: 68,
          y: 58
        },
        {
          id: "gyoza",
          label: "餃子",
          reading: "ぎょうざ",
          romaji: "gyouza",
          english: "gyoza",
          phrase: "餃子はありますか？",
          phraseRomaji: "Gyouza wa arimasu ka?",
          phraseEnglish: "Do you have gyoza?",
          x: 46,
          y: 72
        },
        {
          id: "bill",
          label: "お会計",
          reading: "おかいけい",
          romaji: "okaikei",
          english: "bill / payment",
          phrase: "お会計をお願いします。",
          phraseRomaji: "Okaikei o onegaishimasu.",
          phraseEnglish: "The bill, please.",
          x: 82,
          y: 42
        },
        {
          id: "restroom",
          label: "トイレ",
          reading: "トイレ",
          romaji: "toire",
          english: "restroom",
          phrase: "トイレはどこですか？",
          phraseRomaji: "Toire wa doko desu ka?",
          phraseEnglish: "Where is the restroom?",
          x: 88,
          y: 18
        },
        {
          id: "ramen",
          label: "ラーメン",
          reading: "ラーメン",
          romaji: "raamen",
          english: "ramen",
          phrase: "おすすめは何ですか？",
          phraseRomaji: "Osusume wa nan desu ka?",
          phraseEnglish: "What do you recommend?",
          x: 38,
          y: 52
        }
      ]
    }
  },
  {
    id: "cafe",
    name: "Cafe Order",
    category: "Food & Shopping",
    description:
      "A customer is ordering at a cafe in Japan. Respond naturally as cafe staff. Help them choose dine-in or takeout, order drinks or food, ask about sizes or preferences, and pay.",
    role: "a warm cafe staff member",
    opening: "いらっしゃいませ。店内でお召し上がりですか？",
    shortGoal:
      "Practice ordering at a cafe, choosing options, asking simple questions, and paying naturally.",
    goals: [
      "Say whether it is for here or takeout",
      "Order a drink or food item",
      "Ask about size or options",
      "Make a preference request",
      "Pay politely"
    ],
    usefulPhrases: [
      "店内でお願いします",
      "持ち帰りでお願いします",
      "サイズは何がありますか？",
      "アイスコーヒーをください",
      "砂糖なしでお願いします"
    ],
    estimatedTime: "3–5 minutes",
    jp: "カフェ",
    icon: "Coffee",
    next: "store",
    politenessMode: "Polite",
    registerLabel: "Polite service Japanese"
  },
  {
    id: "store",
    name: "Convenience Store",
    category: "Food & Shopping",
    description:
      "A customer is checking out at a Japanese convenience store. Respond naturally as the cashier. Handle bags, payment, receipts, and simple customer questions.",
    role: "a polite convenience store cashier",
    opening: "いらっしゃいませ。袋はご利用ですか？",
    shortGoal:
      "Practice a convenience store checkout, including bags, payment, receipts, and short polite answers.",
    goals: [
      "Answer about needing a bag",
      "Ask or answer about payment",
      "Respond about a receipt",
      "Ask a simple store question",
      "Thank the cashier naturally"
    ],
    usefulPhrases: [
      "袋をください",
      "袋はいりません",
      "カードで払います",
      "レシートはいりません",
      "これをください"
    ],
    estimatedTime: "3–5 minutes",
    jp: "コンビニ",
    icon: "Store",
    next: "reservation",
    politenessMode: "Polite",
    registerLabel: "Polite service Japanese"
  },
  {
    id: "reservation",
    name: "Making a Reservation",
    category: "Food & Shopping",
    description:
      "A customer is calling a restaurant in Japan to make a reservation. Respond naturally as the restaurant receptionist. Ask for the date, time, number of people, name, and any relevant details.",
    role: "a restaurant receptionist taking phone reservations",
    opening: "お電話ありがとうございます。ご予約でしょうか？",
    shortGoal:
      "Practice making a restaurant reservation by phone and confirming the details politely.",
    goals: [
      "Say that you want to make a reservation",
      "Give the date and time",
      "Give the number of people",
      "Give your name",
      "Confirm the reservation details"
    ],
    usefulPhrases: [
      "予約をしたいです",
      "明日の七時は空いていますか？",
      "二人です",
      "名前は___です",
      "よろしくお願いします"
    ],
    estimatedTime: "4–6 minutes",
    jp: "予約",
    icon: "Calendar",
    next: "allergies",
    politenessMode: "Polite",
    registerLabel: "Polite phone Japanese"
  },
  {
    id: "allergies",
    name: "Asking About Allergies",
    category: "Food & Shopping",
    description:
      "A customer is ordering food at a restaurant and needs to ask about allergies or ingredients. Respond naturally as restaurant staff while keeping the exchange focused on language practice.",
    role: "a careful restaurant staff member",
    opening: "いらっしゃいませ。ご注文はお決まりですか？",
    shortGoal:
      "Practice explaining allergies, asking about ingredients, and confirming food options politely.",
    goals: [
      "Explain an allergy or food restriction",
      "Ask whether an ingredient is included",
      "Ask what is safe to order",
      "Confirm the staff's explanation",
      "Thank the staff politely"
    ],
    usefulPhrases: [
      "アレルギーがあります",
      "これは卵が入っていますか？",
      "ナッツは入っていますか？",
      "食べても大丈夫ですか？",
      "ありがとうございます"
    ],
    estimatedTime: "4–6 minutes",
    jp: "アレルギー",
    icon: "Shield",
    next: "clothes",
    politenessMode: "Polite",
    registerLabel: "Polite service Japanese"
  },
  {
    id: "clothes",
    name: "Buying Clothes",
    category: "Food & Shopping",
    description:
      "A customer is shopping for clothes in Japan. Respond naturally as store staff. Help them ask about size, color, fitting rooms, price, availability, and checkout.",
    role: "a helpful clothing store staff member",
    opening: "いらっしゃいませ。何かお探しですか？",
    shortGoal:
      "Practice shopping for clothes, asking for options, trying items on, and buying politely.",
    goals: [
      "Say what item you are looking for",
      "Ask about size or color",
      "Ask to try something on",
      "Ask about price or availability",
      "Buy or politely decline the item"
    ],
    usefulPhrases: [
      "シャツを探しています",
      "Mサイズはありますか？",
      "他の色はありますか？",
      "試着してもいいですか？",
      "これをお願いします"
    ],
    estimatedTime: "4–6 minutes",
    jp: "買い物",
    icon: "Shirt",
    next: "hotel",
    politenessMode: "Polite",
    registerLabel: "Polite service Japanese"
  },
  {
    id: "hotel",
    name: "Hotel Check-in",
    category: "Travel & Daily Life",
    description:
      "A guest has arrived at a hotel in Japan. Respond naturally as the receptionist. Help them check in, confirm the booking, answer simple questions, and explain useful hotel details.",
    role: "a professional hotel receptionist",
    opening: "いらっしゃいませ。ご予約のお名前をお伺いしてもよろしいですか？",
    shortGoal:
      "Practice checking into a hotel, giving reservation details, and asking about hotel services.",
    goals: [
      "Give the reservation name",
      "Confirm check-in details",
      "Ask about checkout time",
      "Ask about Wi-Fi or amenities",
      "Respond politely to hotel instructions"
    ],
    usefulPhrases: [
      "チェックインをお願いします",
      "予約しています",
      "名前は___です",
      "チェックアウトは何時ですか？",
      "Wi-Fiはありますか？"
    ],
    estimatedTime: "4–6 minutes",
    jp: "ホテル",
    icon: "Hotel",
    next: "train",
    politenessMode: "Polite",
    registerLabel: "Polite travel Japanese"
  },
  {
    id: "train",
    name: "Train Station / Directions",
    category: "Travel & Daily Life",
    description:
      "A traveler is at a Japanese train station and needs help. Respond naturally as station staff. Help with directions, platforms, tickets, transfers, and route confirmation.",
    role: "a patient train station staff member",
    opening: "はい、どうされましたか？",
    shortGoal:
      "Practice asking for directions and train information at a station.",
    goals: [
      "Say where you want to go",
      "Ask which platform to use",
      "Ask where to buy a ticket",
      "Confirm a train line or transfer",
      "Thank the station staff"
    ],
    usefulPhrases: [
      "___へ行きたいです",
      "何番線ですか？",
      "切符はどこで買えますか？",
      "乗り換えはありますか？",
      "ありがとうございます"
    ],
    estimatedTime: "4–6 minutes",
    jp: "駅・道案内",
    icon: "Train",
    next: "clinic",
    politenessMode: "Polite",
    registerLabel: "Polite travel Japanese"
  },
  {
    id: "clinic",
    name: "Doctor / Clinic Visit",
    category: "Travel & Daily Life",
    description:
      "A patient is visiting a clinic in Japan for language practice. Respond naturally as clinic staff or a doctor asking simple intake questions, without giving real medical advice.",
    role: "a clinic staff member asking intake questions",
    opening: "今日はどうされましたか？",
    shortGoal:
      "Practice explaining symptoms, answering clinic questions, and asking what to do next in simple Japanese.",
    goals: [
      "Explain a symptom",
      "Say when it started",
      "Answer simple follow-up questions",
      "Ask about next steps or medicine",
      "Confirm instructions politely"
    ],
    usefulPhrases: [
      "頭が痛いです",
      "昨日からです",
      "熱があります",
      "どうすればいいですか？",
      "薬はありますか？"
    ],
    estimatedTime: "4–6 minutes",
    jp: "クリニック",
    icon: "Stethoscope",
    next: "neighbor",
    politenessMode: "Polite",
    registerLabel: "Polite clinic Japanese"
  },
  {
    id: "neighbor",
    name: "Small Talk with Neighbor",
    category: "Travel & Daily Life",
    description:
      "A learner meets a neighbor in Japan and makes casual everyday small talk. Respond naturally as the neighbor, using friendly greetings, weather talk, and simple follow-up questions.",
    role: "a friendly neighbor",
    opening: "おはようございます。今日はいい天気ですね。",
    shortGoal:
      "Practice friendly small talk, greetings, weather comments, and polite conversation endings.",
    goals: [
      "Return a natural greeting",
      "Respond about the weather",
      "Share a small personal detail",
      "Ask a friendly follow-up question",
      "End the conversation politely"
    ],
    usefulPhrases: [
      "おはようございます",
      "いい天気ですね",
      "そうですね",
      "フィリピンから来ました",
      "またよろしくお願いします"
    ],
    estimatedTime: "3–5 minutes",
    jp: "ご近所",
    icon: "Sun",
    next: "workplace",
    politenessMode: "Casual",
    registerLabel: "Friendly casual Japanese"
  },
  {
    id: "workplace",
    name: "Workplace Introduction",
    category: "Work & Professional",
    description:
      "A learner is meeting a coworker on their first day in a Japanese workplace. Respond naturally as a coworker. Help them introduce themselves, explain their role, and ask about the team.",
    role: "a welcoming coworker",
    opening: "はじめまして。今日からご一緒する方ですね。",
    shortGoal:
      "Practice a workplace self-introduction and simple professional small talk.",
    goals: [
      "Say your name",
      "Say where you are from",
      "Explain your role or work",
      "Ask about the team or workplace",
      "Close with a polite greeting"
    ],
    usefulPhrases: [
      "はじめまして",
      "___と申します",
      "フィリピンから来ました",
      "カスタマーサポートをしています",
      "よろしくお願いいたします"
    ],
    estimatedTime: "4–6 minutes",
    jp: "職場",
    icon: "Briefcase",
    next: "interview",
    politenessMode: "Business",
    registerLabel: "Professional beginner Japanese"
  },
  {
    id: "interview",
    name: "Job Interview Introduction",
    category: "Work & Professional",
    description:
      "A learner is beginning a Japanese job interview for language practice. Respond naturally as the interviewer. Ask for self-introduction, experience, strengths, and appropriate follow-up questions without giving hiring advice.",
    role: "a professional Japanese interviewer",
    opening: "本日はお越しいただきありがとうございます。まずは自己紹介をお願いします。",
    shortGoal:
      "Practice a professional interview introduction and answering follow-up questions in Japanese.",
    goals: [
      "Give a professional self-introduction",
      "Explain your experience",
      "Talk about strengths",
      "Answer a follow-up question",
      "Use business politeness"
    ],
    usefulPhrases: [
      "自己紹介をさせていただきます",
      "___と申します",
      "前職では___を担当していました",
      "問題解決が得意です",
      "よろしくお願いいたします"
    ],
    estimatedTime: "5–7 minutes",
    jp: "面接",
    icon: "MessagesSquare",
    next: "ramen",
    politenessMode: "Business",
    registerLabel: "Professional interview Japanese"
  }
];
