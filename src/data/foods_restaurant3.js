// ─── Restaurant Menu Items — Batch 3 ─────────────────────────────────────────
// Chains: Domino's · Papa John's · Little Caesars · Bojangles · Church's Chicken
//         Checkers/Rally's · Slim Chickens · Wawa
// Sources: Official nutrition PDFs, CalorieKing, fastfoodnutrition.org,
//          FatSecret, University Hospitals nutrition library (USDA-linked data)

export const FOODS_RESTAURANT3 = [

  // ══ DOMINO'S ══════════════════════════════════════════════════════════════
  // Hand Tossed Large (14", 1/8 slice). Serving weights: ~102g cheese,
  // ~102g pepperoni (CalorieKing 3.6 oz), ~134g CBR, ~153g Extravaganzza,
  // ~131g Pacific Veggie (FatSecret / CalorieKing data).

  { id: 'r_dom_cheese_pizza_sl', name: 'Cheese Pizza Slice (Hand Tossed, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 102, servingUnit: '1 slice (1/8 pizza)', calories: 285, protein: 11, carbs: 36, fiber: 1, sugar: 3, fat: 10, saturatedFat: 5, sodium: 550 },

  { id: 'r_dom_pepperoni_pizza_sl', name: 'Pepperoni Pizza Slice (Hand Tossed, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 102, servingUnit: '1 slice (1/8 pizza)', calories: 280, protein: 11, carbs: 32, fiber: 1, sugar: 1, fat: 11, saturatedFat: 5, sodium: 500 },

  { id: 'r_dom_cbr_pizza_sl', name: 'Chicken Bacon Ranch Pizza Slice (Hand Tossed, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 134, servingUnit: '1 slice (1/8 pizza)', calories: 410, protein: 16, carbs: 33, fiber: 1, sugar: 3, fat: 23, saturatedFat: 8, sodium: 890 },

  { id: 'r_dom_extravaganzza_sl', name: 'ExtravaganZZa Feast Pizza Slice (Hand Tossed, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 153, servingUnit: '1 slice (1/8 pizza)', calories: 380, protein: 16, carbs: 36, fiber: 2, sugar: 3, fat: 19, saturatedFat: 8, sodium: 900 },

  { id: 'r_dom_veggie_pizza_sl', name: 'Pacific Veggie Pizza Slice (Hand Tossed, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 131, servingUnit: '1 slice (1/8 pizza)', calories: 310, protein: 12, carbs: 34, fiber: 2, sugar: 4, fat: 13, saturatedFat: 6, sodium: 650 },

  // Thin Crust Large (14", 1/8 slice) — ~74g cheese, ~80g pepperoni (USDA/CalorieKing)
  { id: 'r_dom_thin_cheese_sl', name: 'Cheese Pizza Slice (Thin Crust, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 74, servingUnit: '1 slice (1/8 pizza)', calories: 210, protein: 10, carbs: 22, fiber: 1, sugar: 2, fat: 9, saturatedFat: 4, sodium: 490 },

  { id: 'r_dom_thin_pepperoni_sl', name: 'Pepperoni Pizza Slice (Thin Crust, Large)', brand: "Domino's", category: 'Restaurant', servingSize: 80, servingUnit: '1 slice (1/8 pizza)', calories: 260, protein: 11, carbs: 20, fiber: 1, sugar: 2, fat: 15, saturatedFat: 5, sodium: 480 },

  // Pan (Handmade Pan) — Domino's only offers pan up to medium in most markets;
  // nutrition below is per 1/8 of a medium (12") pan pizza as listed on CalorieKing.
  { id: 'r_dom_pan_cheese_sl', name: 'Cheese Pizza Slice (Handmade Pan, Medium)', brand: "Domino's", category: 'Restaurant', servingSize: 91, servingUnit: '1 slice (1/8 pizza)', calories: 290, protein: 10, carbs: 28, fiber: 1, sugar: 1, fat: 15, saturatedFat: 8, sodium: 410 },

  { id: 'r_dom_pan_pepperoni_sl', name: 'Pepperoni Pizza Slice (Handmade Pan, Medium)', brand: "Domino's", category: 'Restaurant', servingSize: 97, servingUnit: '1 slice (1/8 pizza)', calories: 310, protein: 12, carbs: 28, fiber: 1, sugar: 1, fat: 17, saturatedFat: 9, sodium: 560 },

  // Sides & Appetizers
  { id: 'r_dom_stuffed_cheesy_bread_2pc', name: 'Stuffed Cheesy Bread (Cheese, 2 pc)', brand: "Domino's", category: 'Restaurant', servingSize: 76, servingUnit: '2 pieces', calories: 300, protein: 12, carbs: 32, fiber: 2, sugar: 2, fat: 14, saturatedFat: 6, sodium: 500 },

  { id: 'r_dom_garlic_bread_twists_2pc', name: 'Garlic Bread Twists (2 pc)', brand: "Domino's", category: 'Restaurant', servingSize: 67, servingUnit: '2 pieces', calories: 220, protein: 5, carbs: 27, fiber: 1, sugar: 1, fat: 11, saturatedFat: 5, sodium: 220 },

  { id: 'r_dom_parm_bread_bites_16pc', name: 'Parmesan Bread Bites (16 pc)', brand: "Domino's", category: 'Restaurant', servingSize: 112, servingUnit: '16 pieces', calories: 300, protein: 8, carbs: 48, fiber: 2, sugar: 1, fat: 8, saturatedFat: 4, sodium: 380 },

  { id: 'r_dom_bbq_wings_2pc', name: 'BBQ Chicken Wings (2 pc)', brand: "Domino's", category: 'Restaurant', servingSize: 59, servingUnit: '2 wings', calories: 120, protein: 7, carbs: 9, fiber: 0, sugar: 5, fat: 7, saturatedFat: 2, sodium: 420 },

  { id: 'r_dom_marbled_cookie_brownie_2pc', name: 'Marbled Cookie Brownie (2 pc)', brand: "Domino's", category: 'Restaurant', servingSize: 84, servingUnit: '2 pieces', calories: 380, protein: 4, carbs: 50, fiber: 2, sugar: 36, fat: 18, saturatedFat: 7, sodium: 240 },

  { id: 'r_dom_chicken_parm_sub', name: 'Oven-Baked Chicken Parmesan Sub', brand: "Domino's", category: 'Restaurant', servingSize: 280, servingUnit: '1 sandwich', calories: 760, protein: 50, carbs: 74, fiber: 4, sugar: 4, fat: 30, saturatedFat: 16, sodium: 2000 },


  // ══ PAPA JOHN'S ═══════════════════════════════════════════════════════════
  // All large (14") original crust slices are 1/8 of the pizza.

  { id: 'r_pj_cheese_pizza_sl', name: 'Cheese Pizza Slice (Original Crust, Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 125, servingUnit: '1 slice (1/8 pizza)', calories: 290, protein: 11, carbs: 37, fiber: 2, sugar: 4, fat: 10, saturatedFat: 5, sodium: 720 },

  { id: 'r_pj_pepperoni_pizza_sl', name: 'Pepperoni Pizza Slice (Original Crust, Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 130, servingUnit: '1 slice (1/8 pizza)', calories: 330, protein: 13, carbs: 37, fiber: 2, sugar: 4, fat: 14, saturatedFat: 6, sodium: 870 },

  { id: 'r_pj_the_works_sl', name: 'The Works Pizza Slice (Original Crust, Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 157, servingUnit: '1 slice (1/8 pizza)', calories: 330, protein: 13, carbs: 39, fiber: 2, sugar: 5, fat: 14, saturatedFat: 6, sodium: 930 },

  { id: 'r_pj_bbq_chicken_bacon_sl', name: 'BBQ Chicken & Bacon Pizza Slice (Original Crust, Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 150, servingUnit: '1 slice (1/8 pizza)', calories: 350, protein: 15, carbs: 45, fiber: 2, sugar: 4, fat: 12, saturatedFat: 5, sodium: 1030 },

  { id: 'r_pj_thin_cheese_sl', name: 'Cheese Pizza Slice (Thin Crust, Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 87, servingUnit: '1 slice (1/8 pizza)', calories: 230, protein: 10, carbs: 23, fiber: 2, sugar: 3, fat: 11, saturatedFat: 5, sodium: 460 },

  { id: 'r_pj_garlic_parm_breadstick_1', name: 'Garlic Parmesan Breadstick (1 stick)', brand: "Papa John's", category: 'Restaurant', servingSize: 58, servingUnit: '1 stick', calories: 145, protein: 5, carbs: 27, fiber: 1, sugar: 3, fat: 3, saturatedFat: 0, sodium: 270 },

  { id: 'r_pj_cheesesticks_2pc', name: 'Cheesesticks (2 sticks)', brand: "Papa John's", category: 'Restaurant', servingSize: 68, servingUnit: '2 sticks', calories: 185, protein: 7, carbs: 21, fiber: 1, sugar: 2, fat: 8, saturatedFat: 4, sodium: 430 },

  { id: 'r_pj_chicken_poppers_5pc', name: 'Chicken Poppers (5 pc)', brand: "Papa John's", category: 'Restaurant', servingSize: 80, servingUnit: '5 pieces', calories: 100, protein: 18, carbs: 2, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0, sodium: 340 },

  { id: 'r_pj_papadia_bbq_chicken', name: 'Grilled BBQ Chicken & Bacon Papadia', brand: "Papa John's", category: 'Restaurant', servingSize: 340, servingUnit: '1 papadia', calories: 840, protein: 60, carbs: 85, fiber: 4, sugar: 26, fat: 28, saturatedFat: 13, sodium: 2410 },

  { id: 'r_pj_papadia_philly', name: 'Philly Cheesesteak Papadia', brand: "Papa John's", category: 'Restaurant', servingSize: 320, servingUnit: '1 papadia', calories: 810, protein: 40, carbs: 80, fiber: 4, sugar: 11, fat: 35, saturatedFat: 15, sodium: 2090 },

  { id: 'r_pj_cheese_pizza_whole_lg', name: 'Original Cheese Pizza (Whole Large, 14")', brand: "Papa John's", category: 'Restaurant', servingSize: 1000, servingUnit: '1 whole pizza (8 slices)', calories: 2320, protein: 88, carbs: 296, fiber: 16, sugar: 32, fat: 80, saturatedFat: 40, sodium: 5760 },

  { id: 'r_pj_double_xl_pepperoni_sl', name: 'Pepperoni Pizza Slice (Original Crust, Extra Large)', brand: "Papa John's", category: 'Restaurant', servingSize: 137, servingUnit: '1 slice (1/8 pizza)', calories: 340, protein: 13, carbs: 40, fiber: 2, sugar: 5, fat: 14, saturatedFat: 6, sodium: 900 },


  // ══ LITTLE CAESARS ═══════════════════════════════════════════════════════
  // All HOT-N-READY slices are 1/8 of a large round pizza.

  { id: 'r_lc_hnr_pepperoni_sl', name: 'HOT-N-READY Classic Pepperoni Pizza (1 slice)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 89, servingUnit: '1 slice (1/8 pizza)', calories: 280, protein: 13, carbs: 32, fiber: 2, sugar: 2, fat: 11, saturatedFat: 5, sodium: 580 },

  { id: 'r_lc_hnr_cheese_sl', name: 'HOT-N-READY Classic Cheese Pizza (1 slice)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 82, servingUnit: '1 slice (1/8 pizza)', calories: 244, protein: 12, carbs: 31, fiber: 2, sugar: 2, fat: 8, saturatedFat: 4, sodium: 460 },

  { id: 'r_lc_deep_dish_pepperoni_sl', name: 'Deep Dish Pepperoni Pizza (1 slice)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 118, servingUnit: '1 slice (1/8 pizza)', calories: 360, protein: 16, carbs: 38, fiber: 2, sugar: 4, fat: 16, saturatedFat: 6, sodium: 640 },

  { id: 'r_lc_crazy_bread_1', name: 'Crazy Bread (1 stick)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 35, servingUnit: '1 breadstick', calories: 100, protein: 3, carbs: 16, fiber: 1, sugar: 1, fat: 3, saturatedFat: 1, sodium: 161 },

  { id: 'r_lc_crazy_sauce', name: 'Crazy Sauce (dipping cup)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 85, servingUnit: '1 container', calories: 30, protein: 1, carbs: 7, fiber: 2, sugar: 0, fat: 0, saturatedFat: 0, sodium: 530 },

  { id: 'r_lc_bbq_wings_2pc', name: 'Caesar Wings BBQ (2 pc)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 78, servingUnit: '2 wings', calories: 160, protein: 12, carbs: 8, fiber: 0, sugar: 6, fat: 9, saturatedFat: 2, sodium: 560 },

  { id: 'r_lc_italian_cheese_bread_1', name: 'Italian Cheese Bread (1 piece)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 45, servingUnit: '1 piece', calories: 134, protein: 6, carbs: 16, fiber: 1, sugar: 1, fat: 5, saturatedFat: 2, sodium: 220 },

  { id: 'r_lc_pretzel_crust_pizza_sl', name: 'Soft Pretzel Crust Pizza with Cheese (1 slice)', brand: 'Little Caesars', category: 'Restaurant', servingSize: 110, servingUnit: '1 slice (1/8 pizza)', calories: 270, protein: 11, carbs: 31, fiber: 1, sugar: 2, fat: 11, saturatedFat: 5, sodium: 570 },


  // ══ BOJANGLES ═════════════════════════════════════════════════════════════

  { id: 'r_boj_cajun_filet_biscuit', name: 'Cajun Filet Biscuit', brand: 'Bojangles', category: 'Restaurant', servingSize: 232, servingUnit: '1 biscuit sandwich', calories: 570, protein: 23, carbs: 57, fiber: 1, sugar: 4, fat: 27, saturatedFat: 9, sodium: 1720 },

  { id: 'r_boj_country_ham_biscuit', name: 'Country Ham Biscuit', brand: 'Bojangles', category: 'Restaurant', servingSize: 150, servingUnit: '1 biscuit sandwich', calories: 380, protein: 14, carbs: 38, fiber: 1, sugar: 4, fat: 20, saturatedFat: 8, sodium: 1570 },

  { id: 'r_boj_egg_cheese_biscuit', name: 'Egg & Cheese Biscuit', brand: 'Bojangles', category: 'Restaurant', servingSize: 165, servingUnit: '1 biscuit sandwich', calories: 400, protein: 13, carbs: 37, fiber: 1, sugar: 4, fat: 22, saturatedFat: 9, sodium: 950 },

  { id: 'r_boj_sausage_biscuit', name: 'Sausage Biscuit', brand: 'Bojangles', category: 'Restaurant', servingSize: 170, servingUnit: '1 biscuit sandwich', calories: 470, protein: 15, carbs: 38, fiber: 1, sugar: 4, fat: 28, saturatedFat: 11, sodium: 1160 },

  { id: 'r_boj_bo_berry_biscuit', name: 'Bo-Berry Biscuit', brand: 'Bojangles', category: 'Restaurant', servingSize: 120, servingUnit: '1 biscuit', calories: 370, protein: 5, carbs: 49, fiber: 1, sugar: 18, fat: 17, saturatedFat: 8, sodium: 720 },

  { id: 'r_boj_chicken_supremes_4pc', name: 'Chicken Supremes (4 pc)', brand: 'Bojangles', category: 'Restaurant', servingSize: 180, servingUnit: '4 pieces', calories: 500, protein: 32, carbs: 33, fiber: 0, sugar: 0, fat: 25, saturatedFat: 7, sodium: 920 },

  { id: 'r_boj_dirty_rice', name: 'Dirty Rice (Individual)', brand: 'Bojangles', category: 'Restaurant', servingSize: 140, servingUnit: '1 serving', calories: 170, protein: 5, carbs: 23, fiber: 0, sugar: 1, fat: 6, saturatedFat: 2, sodium: 680 },

  { id: 'r_boj_cajun_pintos', name: 'Cajun Pintos (Individual)', brand: 'Bojangles', category: 'Restaurant', servingSize: 170, servingUnit: '1 serving', calories: 110, protein: 7, carbs: 20, fiber: 5, sugar: 2, fat: 0, saturatedFat: 0, sodium: 540 },

  { id: 'r_boj_seasoned_fries_sm', name: 'Seasoned Fries (Small)', brand: 'Bojangles', category: 'Restaurant', servingSize: 113, servingUnit: '1 small', calories: 360, protein: 3, carbs: 39, fiber: 3, sugar: 0, fat: 21, saturatedFat: 7, sodium: 320 },

  { id: 'r_boj_bo_rounds', name: 'Bo-Rounds Potatoes (Small)', brand: 'Bojangles', category: 'Restaurant', servingSize: 120, servingUnit: '1 small', calories: 260, protein: 2, carbs: 27, fiber: 2, sugar: 0, fat: 16, saturatedFat: 5, sodium: 590 },


  // ══ CHURCH'S CHICKEN ══════════════════════════════════════════════════════

  { id: 'r_chx_orig_leg', name: 'Original Chicken Leg', brand: "Church's Chicken", category: 'Restaurant', servingSize: 70, servingUnit: '1 piece', calories: 150, protein: 12, carbs: 6, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 400 },

  { id: 'r_chx_orig_thigh', name: 'Original Chicken Thigh', brand: "Church's Chicken", category: 'Restaurant', servingSize: 125, servingUnit: '1 piece', calories: 360, protein: 18, carbs: 12, fiber: 1, sugar: 0, fat: 27, saturatedFat: 7, sodium: 670 },

  { id: 'r_chx_orig_breast', name: 'Original Chicken Breast', brand: "Church's Chicken", category: 'Restaurant', servingSize: 115, servingUnit: '1 piece', calories: 250, protein: 23, carbs: 9, fiber: 0, sugar: 0, fat: 14, saturatedFat: 3, sodium: 680 },

  { id: 'r_chx_spicy_leg', name: 'Spicy Chicken Leg', brand: "Church's Chicken", category: 'Restaurant', servingSize: 70, servingUnit: '1 piece', calories: 160, protein: 13, carbs: 9, fiber: 1, sugar: 0, fat: 9, saturatedFat: 2, sodium: 490 },

  { id: 'r_chx_chicken_sandwich', name: 'Chicken Sandwich (Original)', brand: "Church's Chicken", category: 'Restaurant', servingSize: 196, servingUnit: '1 sandwich', calories: 450, protein: 25, carbs: 38, fiber: 2, sugar: 5, fat: 22, saturatedFat: 5, sodium: 1050 },

  { id: 'r_chx_honey_butter_biscuit', name: 'Honey Butter Biscuit', brand: "Church's Chicken", category: 'Restaurant', servingSize: 63, servingUnit: '1 biscuit', calories: 230, protein: 3, carbs: 25, fiber: 1, sugar: 5, fat: 15, saturatedFat: 8, sodium: 460 },

  { id: 'r_chx_jalapeno_bombers_2pc', name: 'Jalapeño Cheese Bombers (2 pc)', brand: "Church's Chicken", category: 'Restaurant', servingSize: 57, servingUnit: '2 pieces', calories: 110, protein: 3, carbs: 12, fiber: 1, sugar: 1, fat: 6, saturatedFat: 2, sodium: 345 },

  { id: 'r_chx_coleslaw', name: 'Coleslaw (Individual)', brand: "Church's Chicken", category: 'Restaurant', servingSize: 113, servingUnit: '1 serving', calories: 140, protein: 1, carbs: 13, fiber: 1, sugar: 11, fat: 9, saturatedFat: 2, sodium: 200 },


  // ══ CHECKERS / RALLY'S ═══════════════════════════════════════════════════

  { id: 'r_chk_fully_loaded_burger', name: 'Fully Loaded Burger (Big Buford)', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 272, servingUnit: '1 burger', calories: 660, protein: 38, carbs: 39, fiber: 2, sugar: 9, fat: 39, saturatedFat: 18, sodium: 1730 },

  { id: 'r_chk_checkerburger', name: 'Checkerburger / Rallyburger', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 170, servingUnit: '1 burger', calories: 320, protein: 15, carbs: 39, fiber: 2, sugar: 9, fat: 12, saturatedFat: 5, sodium: 940 },

  { id: 'r_chk_spicy_chicken_sandwich', name: 'Spicy Chicken Sandwich', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 185, servingUnit: '1 sandwich', calories: 340, protein: 15, carbs: 40, fiber: 2, sugar: 5, fat: 13, saturatedFat: 4, sodium: 840 },

  { id: 'r_chk_crispy_fish_sandwich', name: 'Crispy Fish Sandwich', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 220, servingUnit: '1 sandwich', calories: 530, protein: 15, carbs: 52, fiber: 2, sugar: 8, fat: 29, saturatedFat: 7, sodium: 760 },

  { id: 'r_chk_seasoned_fries_reg', name: 'Famous Seasoned Fries (Regular)', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 142, servingUnit: '1 regular', calories: 390, protein: 5, carbs: 48, fiber: 4, sugar: 0, fat: 19, saturatedFat: 5, sodium: 890 },

  { id: 'r_chk_loaded_fries_reg', name: 'Loaded Fries (Regular)', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 320, servingUnit: '1 serving', calories: 870, protein: 19, carbs: 72, fiber: 7, sugar: 3, fat: 56, saturatedFat: 16, sodium: 2190 },

  { id: 'r_chk_chicken_bites_5pc', name: 'Chicken Bites (5 pc)', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 70, servingUnit: '5 pieces', calories: 250, protein: 12, carbs: 14, fiber: 1, sugar: 0, fat: 16, saturatedFat: 7, sodium: 580 },

  { id: 'r_chk_fudge_brownie_shake_sm', name: 'Chocolate Milkshake (Small)', brand: "Checkers/Rally's", category: 'Restaurant', servingSize: 325, servingUnit: '1 small', calories: 480, protein: 9, carbs: 75, fiber: 1, sugar: 64, fat: 17, saturatedFat: 10, sodium: 340 },


  // ══ SLIM CHICKENS ════════════════════════════════════════════════════════
  // Per-tender nutrition: 95 cal, 11g protein, 3g carbs, 5g fat, 190mg sodium.
  // 3-tender serving is extrapolated from single-tender official data.

  { id: 'r_slim_chicken_tenders_3pc', name: 'Chicken Tenders (3 pc, Plain Fried)', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 117, servingUnit: '3 tenders', calories: 285, protein: 33, carbs: 9, fiber: 3, sugar: 0, fat: 15, saturatedFat: 3, sodium: 570 },

  { id: 'r_slim_chicken_sandwich', name: 'Crispy Chicken Sandwich', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 207, servingUnit: '1 sandwich', calories: 589, protein: 31, carbs: 39, fiber: 2, sugar: 7, fat: 33, saturatedFat: 8, sodium: 985 },

  { id: 'r_slim_grilled_chicken_sandwich', name: 'Grilled Chicken Sandwich', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 200, servingUnit: '1 sandwich', calories: 430, protein: 36, carbs: 36, fiber: 2, sugar: 5, fat: 15, saturatedFat: 4, sodium: 810 },

  { id: 'r_slim_cayenne_ranch_sandwich', name: 'Cayenne Ranch Chicken Sandwich', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 248, servingUnit: '1 sandwich', calories: 655, protein: 32, carbs: 45, fiber: 3, sugar: 7, fat: 37, saturatedFat: 9, sodium: 1092 },

  { id: 'r_slim_tender_wrap', name: "Slim's Wrap (Grilled)", brand: 'Slim Chickens', category: 'Restaurant', servingSize: 290, servingUnit: '1 wrap', calories: 570, protein: 32, carbs: 53, fiber: 2, sugar: 2, fat: 25, saturatedFat: 7, sodium: 1669 },

  { id: 'r_slim_waffles_tenders_2pc', name: 'Waffles & Chicken Tenders (2 pc, Fried)', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 310, servingUnit: '1 plate (2 tenders + waffle)', calories: 680, protein: 30, carbs: 82, fiber: 2, sugar: 18, fat: 24, saturatedFat: 7, sodium: 980 },

  { id: 'r_slim_texas_toast', name: 'Texas Toast (1 slice)', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 45, servingUnit: '1 slice', calories: 104, protein: 3, carbs: 16, fiber: 0, sugar: 2, fat: 3, saturatedFat: 0, sodium: 183 },

  { id: 'r_slim_chicken_bites_5pc', name: 'Chicken Bites (5 pc, Plain)', brand: 'Slim Chickens', category: 'Restaurant', servingSize: 100, servingUnit: '5 pieces', calories: 175, protein: 25, carbs: 0, fiber: 0, sugar: 0, fat: 10, saturatedFat: 5, sodium: 535 },


  // ══ WAWA ═════════════════════════════════════════════════════════════════
  // All hoagies listed without standard toppings/spread (CalorieKing base data).
  // "Shorty" = ~5–6" roll.

  { id: 'r_wawa_chicken_salad_hoagie_sh', name: 'Chicken Salad Classic Hoagie (Shorty)', brand: 'Wawa', category: 'Restaurant', servingSize: 240, servingUnit: '1 shorty hoagie', calories: 530, protein: 28, carbs: 55, fiber: 2, sugar: 4, fat: 22, saturatedFat: 3, sodium: 1120 },

  { id: 'r_wawa_turkey_provolone_hoagie_sh', name: 'Turkey & Provolone Hoagie (Shorty)', brand: 'Wawa', category: 'Restaurant', servingSize: 230, servingUnit: '1 shorty hoagie', calories: 570, protein: 35, carbs: 51, fiber: 2, sugar: 4, fat: 24, saturatedFat: 6, sodium: 1890 },

  { id: 'r_wawa_italian_hoagie_sh', name: 'Italian Hoagie (Shorty)', brand: 'Wawa', category: 'Restaurant', servingSize: 210, servingUnit: '1 shorty hoagie', calories: 420, protein: 25, carbs: 47, fiber: 2, sugar: 1, fat: 14, saturatedFat: 4, sodium: 1430 },

  { id: 'r_wawa_blt_hoagie_sh', name: 'BLT Hoagie (Shorty)', brand: 'Wawa', category: 'Restaurant', servingSize: 195, servingUnit: '1 shorty hoagie', calories: 440, protein: 19, carbs: 47, fiber: 2, sugar: 3, fat: 18, saturatedFat: 6, sodium: 1070 },

  { id: 'r_wawa_grilled_chicken_quesadilla', name: 'Grilled Chicken Quesadilla', brand: 'Wawa', category: 'Restaurant', servingSize: 230, servingUnit: '1 quesadilla', calories: 380, protein: 28, carbs: 44, fiber: 1, sugar: 3, fat: 12, saturatedFat: 5, sodium: 1070 },

  { id: 'r_wawa_mac_cheese_bowl', name: 'Mac & Cheese Bowl', brand: 'Wawa', category: 'Restaurant', servingSize: 340, servingUnit: '1 bowl', calories: 560, protein: 25, carbs: 55, fiber: 1, sugar: 8, fat: 27, saturatedFat: 12, sodium: 1500 },

]
