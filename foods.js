/*
  KHURAK food list — grams of CARBOHYDRATE per portion.

  Each row:  [id, name, other names (for search), category, unit, home, outside, rich]

  unit     how the portion is measured (sizes are in UNITS below)
  home     carbs for ONE medium portion made at home       (null = not usually made at home)
  outside  carbs for ONE medium portion from dhaba/shop     (null = only home version)
  rich     1 = oily / buttery / creamy (sugar may rise again 3–5 h later)

  Sources: ISPAD / Life for a Child "Carbohydrate counting – Indian foods" (2021),
  "Nutrition Basics and a Quick Guide to Carbohydrate Counting" (S. Salis, 2018),
  and IFCT/USDA values for items not in those books. A "katori" here = 200 ml bowl.
  These are estimates. Weigh your own portions once in a while and fix numbers here
  or with "Add my own food" in the app.
*/

const UNITS = {
  pc:    { label: "piece", sizes: [["Small", 0.7], ["Medium", 1], ["Large", 1.4]] },
  bowl:  { label: "katori", sizes: [["Small katori (150 ml)", 0.75], ["Katori (200 ml)", 1], ["Big bowl (300 ml)", 1.5]] },
  glass: { label: "glass", sizes: [["Small (150 ml)", 0.6], ["Glass (250 ml)", 1], ["Big (350 ml)", 1.4]] },
  cup:   { label: "cup", sizes: [["Small cup", 0.7], ["Cup", 1], ["Mug", 1.5]] },
  plate: { label: "plate", sizes: [["Half / small", 0.6], ["Regular", 1], ["Large", 1.4]] },
  fix:   { label: "", sizes: null }
};

const CATS = [
  ["bread", "Roti & paratha"],
  ["rice", "Rice"],
  ["dal", "Dal & sabzi"],
  ["meat", "Chicken, egg & meat"],
  ["nashta", "Nashta"],
  ["street", "Street & fast food"],
  ["south", "South Indian"],
  ["drink", "Milk & drinks"],
  ["sweet", "Mithai & sweets"],
  ["fruit", "Fruits & nuts"],
  ["extra", "Extras"]
];

const FOODS = [
  // ---------- Roti & paratha ----------
  ["roti", "Roti / phulka", "chapati chapatti fulka", "bread", "pc", 15, null, 0],
  ["roti_ghee", "Roti with ghee", "chapati chopri", "bread", "pc", 15, null, 1],
  ["tandoori_roti", "Tandoori roti", "tandoor", "bread", "pc", null, 33, 0],
  ["rumali", "Rumali roti", "roomali", "bread", "pc", null, 25, 0],
  ["missi", "Missi roti", "besan roti", "bread", "pc", 20, 28, 0],
  ["makki", "Makki di roti", "makki ki roti corn", "bread", "pc", 20, 28, 1],
  ["bajra", "Bajra roti", "millet bhakri", "bread", "pc", 20, null, 0],
  ["jowar", "Jowar roti", "millet bhakri", "bread", "pc", 18, null, 0],
  ["par_plain", "Plain paratha", "parantha parontha tikona", "bread", "pc", 22, 32, 1],
  ["par_aloo", "Aloo paratha", "parantha potato", "bread", "pc", 30, 45, 1],
  ["par_gobi", "Gobi paratha", "parantha cauliflower", "bread", "pc", 26, 38, 1],
  ["par_mooli", "Mooli paratha", "parantha radish", "bread", "pc", 24, 36, 1],
  ["par_methi", "Methi paratha", "parantha fenugreek", "bread", "pc", 22, 32, 1],
  ["par_paneer", "Paneer paratha", "parantha", "bread", "pc", 22, 34, 1],
  ["par_pyaz", "Pyaz paratha", "parantha onion", "bread", "pc", 25, 36, 1],
  ["par_mix", "Mix veg paratha", "parantha", "bread", "pc", 24, 35, 1],
  ["par_dal", "Dal / sattu paratha", "parantha", "bread", "pc", 20, 30, 1],
  ["par_lachha", "Lachha paratha", "parantha laccha", "bread", "pc", 28, 38, 1],
  ["naan", "Naan (plain)", "nan", "bread", "pc", null, 47, 0],
  ["naan_butter", "Butter naan", "nan", "bread", "pc", null, 48, 1],
  ["naan_garlic", "Garlic naan", "nan", "bread", "pc", null, 50, 1],
  ["kulcha", "Kulcha (plain)", "kulche", "bread", "pc", null, 33, 0],
  ["kulcha_amr", "Amritsari kulcha (stuffed)", "kulche aloo", "bread", "pc", null, 55, 1],
  ["bhatura", "Bhatura", "bhature", "bread", "pc", 30, 40, 1],
  ["puri", "Puri", "poori", "bread", "pc", 8, 10, 1],
  ["bread_white", "Bread slice (white)", "double roti toast", "bread", "fix", 15, null, 0],
  ["bread_brown", "Bread slice (brown / atta)", "toast", "bread", "fix", 13, null, 0],
  ["pav", "Pav / bun", "pao", "bread", "fix", 15, null, 0],

  // ---------- Rice ----------
  ["rice", "Plain rice", "chawal bhaat", "rice", "bowl", 30, 40, 0],
  ["jeera_rice", "Jeera rice", "chawal", "rice", "bowl", 32, 42, 1],
  ["pulao", "Veg pulao", "pulav chawal", "rice", "bowl", 30, 40, 1],
  ["biryani_veg", "Veg biryani", "chawal", "rice", "bowl", 35, 50, 1],
  ["biryani_ch", "Chicken / mutton biryani", "chawal", "rice", "bowl", 33, 50, 1],
  ["khichdi", "Khichdi", "khichri", "rice", "bowl", 35, null, 0],
  ["curd_rice", "Curd rice", "dahi chawal", "rice", "bowl", 30, null, 0],
  ["fried_rice", "Fried rice", "chinese", "rice", "bowl", null, 45, 1],

  // ---------- Dal & sabzi ----------
  ["dal", "Dal (arhar / moong / masoor)", "daal tadka yellow", "dal", "bowl", 25, 28, 0],
  ["dal_makhani", "Dal makhani / maah di dal", "kaali dal urad", "dal", "bowl", 30, 35, 1],
  ["rajma", "Rajma", "rajmah kidney beans", "dal", "bowl", 30, 35, 0],
  ["chole", "Chole / chana masala", "chhole chickpeas", "dal", "bowl", 30, 35, 0],
  ["kala_chana", "Kala chana", "black chana", "dal", "bowl", 28, null, 0],
  ["kadhi", "Kadhi pakora", "karhi", "dal", "bowl", 18, 22, 1],
  ["saag", "Sarson da saag", "saag sarso", "dal", "bowl", 8, 10, 1],
  ["palak_paneer", "Palak paneer", "", "dal", "bowl", 8, 10, 1],
  ["shahi_paneer", "Shahi paneer / paneer butter masala", "makhani", "dal", "bowl", 10, 16, 1],
  ["kadhai_paneer", "Kadhai paneer", "karahi", "dal", "bowl", 8, 10, 1],
  ["matar_paneer", "Matar paneer", "mutter", "dal", "bowl", 15, 18, 1],
  ["aloo_gobi", "Aloo gobi", "gobhi", "dal", "bowl", 15, 18, 0],
  ["aloo_matar", "Aloo matar", "mutter", "dal", "bowl", 20, 22, 0],
  ["aloo_sabzi", "Aloo sabzi (potato)", "aloo bhaji", "dal", "bowl", 28, 30, 0],
  ["dum_aloo", "Dum aloo", "", "dal", "bowl", 18, 22, 1],
  ["bhindi", "Bhindi", "okra ladyfinger", "dal", "bowl", 6, 8, 0],
  ["baingan", "Baingan bharta", "bartha brinjal", "dal", "bowl", 6, 8, 0],
  ["mix_veg", "Mix veg", "sabzi", "dal", "bowl", 10, 12, 0],
  ["lauki", "Lauki / tinda / tori", "ghiya", "dal", "bowl", 6, null, 0],
  ["band_gobhi", "Band gobhi / cabbage", "patta gobi", "dal", "bowl", 8, null, 0],
  ["soya_chaap", "Soya chaap (gravy / tikka)", "chap", "dal", "plate", 12, 15, 1],
  ["raita", "Boondi raita", "", "dal", "bowl", 12, 12, 0],
  ["raita_veg", "Veg raita (kheera / onion)", "", "dal", "bowl", 8, 8, 0],
  ["dahi", "Dahi (plain curd)", "curd yogurt", "dal", "bowl", 8, null, 0],
  ["salad", "Salad (kheera, pyaz, tamatar)", "", "dal", "plate", 5, 5, 0],

  // ---------- Chicken, egg & meat ----------
  ["butter_chicken", "Butter chicken", "makhani murgh", "meat", "bowl", 6, 12, 1],
  ["chicken_curry", "Chicken curry", "murgh", "meat", "bowl", 5, 6, 1],
  ["mutton_curry", "Mutton / meat curry", "rogan josh", "meat", "bowl", 5, 6, 1],
  ["keema", "Keema", "kheema mince", "meat", "bowl", 5, 6, 1],
  ["keema_matar", "Keema matar", "", "meat", "bowl", 10, 12, 1],
  ["egg_curry", "Egg curry", "anda curry", "meat", "bowl", 6, 8, 1],
  ["fish_curry", "Fish curry", "machhi", "meat", "bowl", 5, 6, 0],
  ["fish_fry", "Amritsari fish fry (plate)", "machhi", "meat", "plate", null, 15, 1],
  ["tandoori", "Tandoori chicken (quarter)", "", "meat", "plate", 4, 5, 0],
  ["tikka", "Chicken tikka (6 pcs)", "", "meat", "plate", 5, 6, 0],
  ["seekh", "Seekh kebab (2 pcs)", "kabab", "meat", "plate", 5, 6, 1],
  ["paneer_tikka", "Paneer tikka (6 pcs)", "", "meat", "plate", 6, 8, 1],
  ["egg_boiled", "Egg (boiled)", "anda", "meat", "fix", 0.5, null, 0],
  ["omelette", "Omelette (2 eggs)", "anda", "meat", "fix", 2, null, 1],
  ["bread_omelette", "Bread omelette", "anda", "meat", "plate", null, 30, 1],

  // ---------- Nashta ----------
  ["poha", "Poha", "pohe", "nashta", "bowl", 30, 35, 0],
  ["upma", "Upma", "suji", "nashta", "bowl", 30, null, 0],
  ["daliya", "Daliya (namkeen)", "dalia broken wheat", "nashta", "bowl", 25, null, 0],
  ["daliya_sweet", "Daliya (sweet, with milk)", "dalia", "nashta", "bowl", 40, null, 0],
  ["oats", "Oats with milk", "porridge", "nashta", "bowl", 30, null, 0],
  ["cornflakes", "Cornflakes with milk", "cereal", "nashta", "bowl", 35, null, 0],
  ["chilla", "Besan / moong chilla", "cheela pudla", "nashta", "pc", 12, null, 0],
  ["sandwich", "Veg sandwich", "", "nashta", "pc", 22, 30, 0],
  ["sandwich_grill", "Grilled aloo sandwich", "", "nashta", "pc", 30, 35, 1],
  ["sprouts", "Sprouts chaat", "moong", "nashta", "bowl", 25, null, 0],

  // ---------- Street & fast food ----------
  ["samosa", "Samosa", "", "street", "pc", 30, 32, 1],
  ["pakora", "Pakore (4–5 pcs)", "pakoda bhajia", "street", "plate", 15, 20, 1],
  ["bread_pakora", "Bread pakora", "", "street", "pc", 24, 26, 1],
  ["aloo_tikki", "Aloo tikki", "", "street", "pc", 15, 18, 1],
  ["tikki_chaat", "Tikki chaat (plate)", "", "street", "plate", null, 45, 1],
  ["golgappe", "Golgappe (6 pcs)", "pani puri gol gappa", "street", "plate", null, 31, 0],
  ["dahi_bhalla", "Dahi bhalla (1 pc)", "dahi vada", "street", "pc", 22, 22, 0],
  ["papdi_chaat", "Papdi chaat (plate)", "", "street", "plate", null, 40, 1],
  ["chole_kulche", "Chole kulche (plate)", "kulche", "street", "plate", null, 65, 1],
  ["chole_bhature", "Chole bhature (plate of 2)", "chhole", "street", "plate", null, 100, 1],
  ["pav_bhaji", "Pav bhaji (bhaji + 2 pav)", "", "street", "plate", 55, 60, 1],
  ["momos", "Momos, steamed (6 pcs)", "momo", "street", "plate", 45, 45, 0],
  ["momos_fried", "Momos, fried (6 pcs)", "momo", "street", "plate", null, 50, 1],
  ["spring_roll", "Spring roll", "", "street", "pc", null, 15, 1],
  ["chowmein", "Chowmein / noodles (plate)", "hakka noodles", "street", "plate", 40, 60, 1],
  ["manchurian", "Manchurian (gravy)", "", "street", "bowl", null, 20, 1],
  ["maggi", "Maggi (1 packet)", "noodles", "street", "fix", 44, null, 1],
  ["pizza", "Pizza slice (medium pizza)", "", "street", "pc", null, 25, 1],
  ["burger", "Burger (veg / aloo tikki)", "", "street", "pc", null, 45, 1],
  ["burger_ch", "Burger (chicken)", "", "street", "pc", null, 40, 1],
  ["fries", "French fries", "chips", "street", "plate", null, 45, 1],
  ["pasta", "Pasta (white / red sauce)", "", "street", "bowl", 35, 40, 1],
  ["roll", "Kathi roll / frankie", "wrap", "street", "pc", null, 35, 1],

  // ---------- South Indian ----------
  ["dosa", "Plain dosa", "dosai", "south", "pc", 15, 30, 0],
  ["masala_dosa", "Masala dosa (with aloo)", "", "south", "pc", 30, 45, 1],
  ["idli", "Idli", "", "south", "pc", 7.5, 15, 0],
  ["medu_vada", "Medu vada", "vada", "south", "pc", 7, 15, 1],
  ["uttapam", "Uttapam", "", "south", "pc", 30, 45, 0],
  ["sambhar", "Sambhar", "sambar", "south", "bowl", 15, 30, 0],
  ["coconut_chutney", "Coconut chutney", "", "south", "bowl", 5, 5, 1],

  // ---------- Milk & drinks ----------
  ["milk", "Milk (cow / toned)", "doodh", "drink", "glass", 12, null, 0],
  ["milk_buff", "Milk (buffalo / full cream)", "doodh majh", "drink", "glass", 13, null, 1],
  ["haldi_milk", "Haldi doodh (no sugar)", "turmeric milk", "drink", "glass", 12, null, 0],
  ["chai", "Chai, no sugar", "tea", "drink", "cup", 3, null, 0],
  ["chai_sugar", "Chai with 1 tsp sugar", "tea", "drink", "cup", 8, 10, 0],
  ["coffee", "Coffee with milk, no sugar", "", "drink", "cup", 5, null, 0],
  ["lassi_sweet", "Lassi (sweet)", "", "drink", "glass", 35, 45, 1],
  ["lassi_salt", "Lassi (namkeen)", "", "drink", "glass", 12, 12, 0],
  ["chaas", "Chaas / buttermilk", "lassi patli", "drink", "glass", 5, 5, 0],
  ["shake", "Banana / mango shake", "milkshake", "drink", "glass", 40, 55, 0],
  ["juice_pack", "Juice (packaged)", "real frooti", "drink", "glass", 26, null, 0],
  ["juice_fresh", "Fresh orange / mosambi juice", "", "drink", "glass", 22, 22, 0],
  ["cola", "Cold drink (cola etc.)", "soft drink coke pepsi", "drink", "glass", 27, null, 0],
  ["cola_diet", "Diet / zero cold drink", "coke zero", "drink", "glass", 0, null, 0],
  ["ganne", "Ganne da juice", "sugarcane", "drink", "glass", null, 40, 0],
  ["shikanji", "Nimbu pani / shikanji (sweet)", "lemonade", "drink", "glass", 20, 25, 0],
  ["paneer", "Paneer (100 g)", "cottage cheese", "drink", "fix", 3, null, 1],

  // ---------- Sweets ----------
  ["gulab_jamun", "Gulab jamun (with syrup)", "", "sweet", "pc", 30, 30, 1],
  ["rasgulla", "Rasgulla (with syrup)", "rosogulla", "sweet", "pc", 25, 25, 0],
  ["rasgulla_sq", "Rasgulla (syrup squeezed out)", "", "sweet", "pc", 15, 15, 0],
  ["rasmalai", "Rasmalai", "", "sweet", "pc", 20, 20, 1],
  ["jalebi", "Jalebi (large)", "", "sweet", "pc", null, 18, 1],
  ["kheer", "Kheer", "rice pudding", "sweet", "bowl", 40, 45, 1],
  ["seviyan", "Seviyan kheer", "sewaiyan", "sweet", "bowl", 40, null, 1],
  ["suji_halwa", "Suji halwa / karah prasad", "sooji sheera kada", "sweet", "bowl", 80, null, 1],
  ["gajar_halwa", "Gajar halwa", "", "sweet", "bowl", 60, 70, 1],
  ["besan_ladoo", "Besan ladoo", "laddu", "sweet", "pc", 31, 31, 1],
  ["pinni", "Pinni", "", "sweet", "pc", 25, 25, 1],
  ["motichoor", "Motichoor ladoo", "boondi laddu", "sweet", "pc", null, 24, 1],
  ["barfi", "Barfi (1 pc)", "burfi", "sweet", "pc", null, 15, 1],
  ["kaju_katli", "Kaju katli (1 pc)", "", "sweet", "pc", null, 6, 1],
  ["peda", "Peda", "", "sweet", "pc", null, 13, 1],
  ["kulfi", "Kulfi", "", "sweet", "pc", null, 25, 1],
  ["ice_cream", "Ice cream (1 scoop)", "", "sweet", "pc", null, 12, 1],
  ["cake", "Cake / pastry (1 slice)", "", "sweet", "pc", null, 35, 1],
  ["chocolate", "Milk chocolate (6 small squares)", "dairy milk", "sweet", "fix", 18, null, 1],

  // ---------- Fruits & nuts ----------
  ["apple", "Apple", "seb", "fruit", "pc", 20, null, 0],
  ["banana", "Banana", "kela", "fruit", "pc", 25, null, 0],
  ["mango", "Mango", "aam", "fruit", "pc", 35, null, 0],
  ["orange", "Orange / kinnow", "santra malta", "fruit", "pc", 15, null, 0],
  ["guava", "Guava", "amrood", "fruit", "pc", 10, null, 0],
  ["chikoo", "Chikoo", "sapota", "fruit", "pc", 15, null, 0],
  ["pear", "Pear", "nashpati", "fruit", "pc", 20, null, 0],
  ["papaya", "Papaya (cubes)", "papita", "fruit", "bowl", 15, null, 0],
  ["watermelon", "Watermelon (cubes)", "tarbooz", "fruit", "bowl", 11, null, 0],
  ["muskmelon", "Kharbooja (cubes)", "muskmelon", "fruit", "bowl", 8, null, 0],
  ["pomegranate", "Anar (seeds)", "pomegranate", "fruit", "bowl", 25, null, 0],
  ["grapes", "Grapes (20)", "angoor", "fruit", "fix", 15, null, 0],
  ["litchi", "Litchi (6)", "lychee", "fruit", "fix", 15, null, 0],
  ["dates", "Dates / khajoor (1)", "", "fruit", "fix", 6, null, 0],
  ["makhana", "Makhana (1 katori, roasted)", "fox nut", "fruit", "fix", 15, null, 0],
  ["chana_roast", "Roasted chana (handful, 30 g)", "bhuna", "fruit", "fix", 15, null, 0],
  ["peanuts", "Peanuts (handful, 30 g)", "moongphali", "fruit", "fix", 5, null, 1],
  ["almonds", "Almonds (10)", "badam", "fruit", "fix", 2.5, null, 1],
  ["namkeen", "Namkeen / bhujia (handful, 30 g)", "", "fruit", "fix", 15, null, 1],

  // ---------- Extras ----------
  ["sugar_tsp", "Sugar (1 tsp)", "cheeni", "extra", "fix", 5, null, 0],
  ["gur", "Gur / jaggery (small piece, 10 g)", "jaggery", "extra", "fix", 9, null, 0],
  ["honey", "Honey (1 tsp)", "shahad", "extra", "fix", 6, null, 0],
  ["biscuit", "Biscuit, Parle-G / Marie (1)", "", "extra", "fix", 3.8, null, 0],
  ["rusk", "Rusk (1)", "papay", "extra", "fix", 8, null, 0],
  ["ketchup", "Ketchup (1 tbsp)", "sauce", "extra", "fix", 4, null, 0],
  ["achaar", "Achaar (1 tsp)", "pickle", "extra", "fix", 0.5, null, 1],
  ["butter", "Butter / ghee (1 tsp)", "makhan", "extra", "fix", 0, null, 1]
];

// Shown as one-tap chips under the plate ("add milk, chai, sugar…")
const QUICK_EXTRAS = ["milk", "chai_sugar", "sugar_tsp", "dahi", "lassi_sweet", "raita", "salad", "apple"];
