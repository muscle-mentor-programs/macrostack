// ─── Restaurant Menu Items — Batch 2 ─────────────────────────────────────────
// Chains: KFC · Arby's · Dairy Queen · Whataburger · In-N-Out · Raising Cane's
//         Carl's Jr./Hardee's · Del Taco · El Pollo Loco
// Nutrition data from official restaurant nutrition pages and verified databases.

export const FOODS_RESTAURANT2 = [

  // ══ KFC ══════════════════════════════════════════════════════════════════════

  { id: 'r_kfc_orig_breast', name: 'Original Recipe Chicken Breast', brand: 'KFC', category: 'Restaurant', servingSize: 163, servingUnit: '1 piece', calories: 390, protein: 39, carbs: 11, fiber: 0, sugar: 0, fat: 21, saturatedFat: 4, sodium: 1190 },

  { id: 'r_kfc_orig_thigh', name: 'Original Recipe Chicken Thigh', brand: 'KFC', category: 'Restaurant', servingSize: 113, servingUnit: '1 piece', calories: 280, protein: 19, carbs: 8, fiber: 0, sugar: 0, fat: 19, saturatedFat: 5, sodium: 910 },

  { id: 'r_kfc_orig_drumstick', name: 'Original Recipe Chicken Drumstick', brand: 'KFC', category: 'Restaurant', servingSize: 65, servingUnit: '1 piece', calories: 130, protein: 12, carbs: 4, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 430 },

  { id: 'r_kfc_orig_wing', name: 'Original Recipe Chicken Wing', brand: 'KFC', category: 'Restaurant', servingSize: 52, servingUnit: '1 piece', calories: 130, protein: 10, carbs: 3, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 370 },

  { id: 'r_kfc_xc_breast', name: 'Extra Crispy Chicken Breast', brand: 'KFC', category: 'Restaurant', servingSize: 176, servingUnit: '1 piece', calories: 530, protein: 35, carbs: 18, fiber: 0, sugar: 1, fat: 35, saturatedFat: 6, sodium: 1150 },

  { id: 'r_kfc_xc_thigh', name: 'Extra Crispy Chicken Thigh', brand: 'KFC', category: 'Restaurant', servingSize: 119, servingUnit: '1 piece', calories: 330, protein: 22, carbs: 9, fiber: 0, sugar: 0, fat: 23, saturatedFat: 5, sodium: 700 },

  { id: 'r_kfc_chicken_sandwich', name: 'KFC Classic Chicken Sandwich', brand: 'KFC', category: 'Restaurant', servingSize: 219, servingUnit: '1 sandwich', calories: 650, protein: 34, carbs: 49, fiber: 2, sugar: 5, fat: 35, saturatedFat: 5, sodium: 1260 },

  { id: 'r_kfc_spicy_chicken_sandwich', name: 'KFC Spicy Chicken Sandwich', brand: 'KFC', category: 'Restaurant', servingSize: 213, servingUnit: '1 sandwich', calories: 620, protein: 34, carbs: 49, fiber: 2, sugar: 5, fat: 33, saturatedFat: 5, sodium: 2140 },

  { id: 'r_kfc_famous_bowl', name: 'KFC Famous Bowl', brand: 'KFC', category: 'Restaurant', servingSize: 531, servingUnit: '1 bowl', calories: 740, protein: 26, carbs: 81, fiber: 6, sugar: 2, fat: 35, saturatedFat: 6, sodium: 2350 },

  { id: 'r_kfc_popcorn_nuggets_lg', name: 'Popcorn Chicken Nuggets (Large)', brand: 'KFC', category: 'Restaurant', servingSize: 170, servingUnit: '1 large', calories: 620, protein: 27, carbs: 39, fiber: 2, sugar: 0, fat: 39, saturatedFat: 5, sodium: 1820 },

  { id: 'r_kfc_mashed_potatoes_gravy', name: 'Mashed Potatoes & Gravy', brand: 'KFC', category: 'Restaurant', servingSize: 156, servingUnit: '1 individual', calories: 130, protein: 2, carbs: 20, fiber: 1, sugar: 0, fat: 5, saturatedFat: 1, sodium: 530 },

  { id: 'r_kfc_coleslaw', name: 'Coleslaw', brand: 'KFC', category: 'Restaurant', servingSize: 145, servingUnit: '1 individual', calories: 170, protein: 1, carbs: 21, fiber: 2, sugar: 14, fat: 10, saturatedFat: 2, sodium: 190 },

  { id: 'r_kfc_mac_cheese', name: 'Mac & Cheese', brand: 'KFC', category: 'Restaurant', servingSize: 120, servingUnit: '1 individual', calories: 140, protein: 5, carbs: 17, fiber: 0, sugar: 2, fat: 6, saturatedFat: 2, sodium: 590 },

  { id: 'r_kfc_corn_cob', name: 'Corn on the Cob (1 ear)', brand: 'KFC', category: 'Restaurant', servingSize: 100, servingUnit: '1 ear', calories: 70, protein: 2, carbs: 17, fiber: 2, sugar: 4, fat: 1, saturatedFat: 0, sodium: 0 },

  { id: 'r_kfc_biscuit', name: 'Biscuit', brand: 'KFC', category: 'Restaurant', servingSize: 57, servingUnit: '1 biscuit', calories: 180, protein: 4, carbs: 22, fiber: 1, sugar: 2, fat: 8, saturatedFat: 5, sodium: 520 },

  // ══ ARBY'S ════════════════════════════════════════════════════════════════════

  { id: 'r_arbys_classic_roast_beef', name: "Classic Roast Beef", brand: "Arby's", category: 'Restaurant', servingSize: 154, servingUnit: '1 sandwich', calories: 360, protein: 23, carbs: 37, fiber: 1, sugar: 6, fat: 14, saturatedFat: 4, sodium: 990 },

  { id: 'r_arbys_beef_n_cheddar_classic', name: "Beef 'N Cheddar Classic", brand: "Arby's", category: 'Restaurant', servingSize: 195, servingUnit: '1 sandwich', calories: 450, protein: 23, carbs: 45, fiber: 1, sugar: 10, fat: 20, saturatedFat: 6, sodium: 1280 },

  { id: 'r_arbys_half_lb_beef_n_cheddar', name: "Half Pound Beef 'N Cheddar", brand: "Arby's", category: 'Restaurant', servingSize: 319, servingUnit: '1 sandwich', calories: 740, protein: 49, carbs: 48, fiber: 1, sugar: 10, fat: 39, saturatedFat: 14, sodium: 2530 },

  { id: 'r_arbys_smokehouse_brisket', name: 'Smokehouse Brisket Sandwich', brand: "Arby's", category: 'Restaurant', servingSize: 262, servingUnit: '1 sandwich', calories: 600, protein: 33, carbs: 42, fiber: 2, sugar: 8, fat: 35, saturatedFat: 12, sodium: 1240 },

  { id: 'r_arbys_crispy_fish', name: 'Crispy Fish Sandwich', brand: "Arby's", category: 'Restaurant', servingSize: 228, servingUnit: '1 sandwich', calories: 570, protein: 20, carbs: 65, fiber: 3, sugar: 5, fat: 25, saturatedFat: 4, sodium: 990 },

  { id: 'r_arbys_crispy_chicken', name: 'Crispy Chicken Sandwich', brand: "Arby's", category: 'Restaurant', servingSize: 240, servingUnit: '1 sandwich', calories: 540, protein: 27, carbs: 48, fiber: 2, sugar: 6, fat: 27, saturatedFat: 5, sodium: 990 },

  { id: 'r_arbys_mf_turkey_ranch_bacon', name: 'Market Fresh Turkey Ranch & Bacon', brand: "Arby's", category: 'Restaurant', servingSize: 343, servingUnit: '1 sandwich', calories: 810, protein: 45, carbs: 79, fiber: 5, sugar: 8, fat: 35, saturatedFat: 9, sodium: 2420 },

  { id: 'r_arbys_curly_fries_med', name: 'Curly Fries (Medium)', brand: "Arby's", category: 'Restaurant', servingSize: 170, servingUnit: '1 medium', calories: 550, protein: 6, carbs: 65, fiber: 5, sugar: 0, fat: 29, saturatedFat: 4, sodium: 1250 },

  { id: 'r_arbys_curly_fries_sm', name: 'Curly Fries (Small)', brand: "Arby's", category: 'Restaurant', servingSize: 128, servingUnit: '1 small', calories: 410, protein: 5, carbs: 49, fiber: 4, sugar: 0, fat: 22, saturatedFat: 3, sodium: 940 },

  { id: 'r_arbys_potato_cakes_2pc', name: 'Potato Cakes (2pc)', brand: "Arby's", category: 'Restaurant', servingSize: 100, servingUnit: '2 pieces', calories: 250, protein: 2, carbs: 23, fiber: 2, sugar: 0, fat: 14, saturatedFat: 2, sodium: 430 },

  { id: 'r_arbys_mozzarella_sticks_4pc', name: 'Mozzarella Sticks (4pc)', brand: "Arby's", category: 'Restaurant', servingSize: 137, servingUnit: '4 pieces', calories: 440, protein: 19, carbs: 37, fiber: 2, sugar: 2, fat: 23, saturatedFat: 8, sodium: 1410 },

  { id: 'r_arbys_jamocha_shake_med', name: 'Jamocha Shake (Medium)', brand: "Arby's", category: 'Restaurant', servingSize: 397, servingUnit: '1 medium', calories: 570, protein: 14, carbs: 98, fiber: 1, sugar: 88, fat: 15, saturatedFat: 10, sodium: 440 },

  // ══ DAIRY QUEEN ═══════════════════════════════════════════════════════════════

  { id: 'r_dq_cheeseburger', name: 'DQ Cheeseburger', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 153, servingUnit: '1 burger', calories: 400, protein: 22, carbs: 36, fiber: 1, sugar: 7, fat: 18, saturatedFat: 8, sodium: 910 },

  { id: 'r_dq_grillburger_quarter_lb', name: '1/4 lb GrillBurger with Cheese', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 224, servingUnit: '1 burger', calories: 540, protein: 26, carbs: 43, fiber: 2, sugar: 8, fat: 29, saturatedFat: 12, sodium: 960 },

  { id: 'r_dq_crispy_chicken_sandwich', name: 'Crispy Chicken Sandwich', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 213, servingUnit: '1 sandwich', calories: 550, protein: 25, carbs: 49, fiber: 3, sugar: 5, fat: 28, saturatedFat: 5, sodium: 980 },

  { id: 'r_dq_grilled_chicken_sandwich', name: 'Grilled Chicken Sandwich', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 196, servingUnit: '1 sandwich', calories: 390, protein: 29, carbs: 34, fiber: 1, sugar: 5, fat: 15, saturatedFat: 3, sodium: 970 },

  { id: 'r_dq_chicken_strip_basket_4pc', name: 'Chicken Strip Basket (4pc, no drink)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 442, servingUnit: '1 basket', calories: 1020, protein: 35, carbs: 113, fiber: 5, sugar: 5, fat: 48, saturatedFat: 9, sodium: 2300 },

  { id: 'r_dq_vanilla_cone_med', name: 'Vanilla Soft Serve Cone (Medium)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 198, servingUnit: '1 medium', calories: 320, protein: 8, carbs: 50, fiber: 0, sugar: 36, fat: 10, saturatedFat: 6, sodium: 130 },

  { id: 'r_dq_choc_dipped_cone_med', name: 'Chocolate Dipped Cone (Medium)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 234, servingUnit: '1 medium', calories: 460, protein: 9, carbs: 58, fiber: 1, sugar: 43, fat: 22, saturatedFat: 13, sodium: 140 },

  { id: 'r_dq_oreo_blizzard_med', name: 'Oreo Blizzard (Medium)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 397, servingUnit: '1 medium', calories: 790, protein: 14, carbs: 117, fiber: 1, sugar: 88, fat: 31, saturatedFat: 15, sodium: 400 },

  { id: 'r_dq_reeses_blizzard_med', name: "Reese's PBC Blizzard (Medium)", brand: 'Dairy Queen', category: 'Restaurant', servingSize: 383, servingUnit: '1 medium', calories: 750, protein: 19, carbs: 102, fiber: 2, sugar: 85, fat: 31, saturatedFat: 14, sodium: 440 },

  { id: 'r_dq_chocolate_shake_med', name: 'Chocolate Shake (Medium)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 468, servingUnit: '1 medium', calories: 710, protein: 16, carbs: 110, fiber: 0, sugar: 96, fat: 23, saturatedFat: 16, sodium: 290 },

  { id: 'r_dq_banana_split', name: 'Banana Split', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 370, servingUnit: '1 split', calories: 520, protein: 9, carbs: 94, fiber: 4, sugar: 74, fat: 14, saturatedFat: 9, sodium: 150 },

  { id: 'r_dq_chicken_strips_4pc', name: 'Chicken Strips (4pc)', brand: 'Dairy Queen', category: 'Restaurant', servingSize: 188, servingUnit: '4 pieces', calories: 480, protein: 36, carbs: 28, fiber: 1, sugar: 0, fat: 24, saturatedFat: 4, sodium: 1100 },

  // ══ WHATABURGER ═══════════════════════════════════════════════════════════════

  { id: 'r_wta_whataburger', name: 'Whataburger', brand: 'Whataburger', category: 'Restaurant', servingSize: 310, servingUnit: '1 burger', calories: 590, protein: 29, carbs: 62, fiber: 4, sugar: 12, fat: 25, saturatedFat: 8, sodium: 1220 },

  { id: 'r_wta_double_meat', name: 'Double Meat Whataburger', brand: 'Whataburger', category: 'Restaurant', servingSize: 435, servingUnit: '1 burger', calories: 835, protein: 47, carbs: 62, fiber: 4, sugar: 12, fat: 44, saturatedFat: 15, sodium: 1470 },

  { id: 'r_wta_bacon_cheese', name: 'Bacon & Cheese Whataburger', brand: 'Whataburger', category: 'Restaurant', servingSize: 350, servingUnit: '1 burger', calories: 750, protein: 39, carbs: 62, fiber: 4, sugar: 12, fat: 37, saturatedFat: 14, sodium: 1910 },

  { id: 'r_wta_grilled_chicken', name: 'Grilled Chicken Sandwich', brand: 'Whataburger', category: 'Restaurant', servingSize: 231, servingUnit: '1 sandwich', calories: 405, protein: 32, carbs: 46, fiber: 5, sugar: 8, fat: 11, saturatedFat: 2, sodium: 910 },

  { id: 'r_wta_spicy_chicken', name: 'Spicy Chicken Sandwich', brand: 'Whataburger', category: 'Restaurant', servingSize: 218, servingUnit: '1 sandwich', calories: 405, protein: 24, carbs: 53, fiber: 1, sugar: 6, fat: 13, saturatedFat: 2, sodium: 1300 },

  { id: 'r_wta_patty_melt', name: 'Patty Melt', brand: 'Whataburger', category: 'Restaurant', servingSize: 354, servingUnit: '1 sandwich', calories: 950, protein: 49, carbs: 45, fiber: 2, sugar: 4, fat: 61, saturatedFat: 21, sodium: 1760 },

  { id: 'r_wta_bfast_bun_sausage', name: 'Breakfast on a Bun with Sausage', brand: 'Whataburger', category: 'Restaurant', servingSize: 198, servingUnit: '1 sandwich', calories: 510, protein: 25, carbs: 26, fiber: 1, sugar: 4, fat: 35, saturatedFat: 12, sodium: 1100 },

  { id: 'r_wta_sausage_taquito', name: 'Sausage Taquito with Cheese', brand: 'Whataburger', category: 'Restaurant', servingSize: 179, servingUnit: '1 taquito', calories: 450, protein: 19, carbs: 28, fiber: 3, sugar: 2, fat: 27, saturatedFat: 10, sodium: 1100 },

  { id: 'r_wta_fries_med', name: 'French Fries (Medium)', brand: 'Whataburger', category: 'Restaurant', servingSize: 128, servingUnit: '1 medium', calories: 420, protein: 5, carbs: 52, fiber: 4, sugar: 0, fat: 21, saturatedFat: 3, sodium: 260 },

  { id: 'r_wta_onion_rings_med', name: 'Onion Rings (Medium)', brand: 'Whataburger', category: 'Restaurant', servingSize: 113, servingUnit: '1 medium', calories: 300, protein: 4, carbs: 32, fiber: 4, sugar: 4, fat: 17, saturatedFat: 2, sodium: 430 },

  // ══ IN-N-OUT BURGER ═══════════════════════════════════════════════════════════

  { id: 'r_ino_hamburger', name: 'Hamburger', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 209, servingUnit: '1 burger', calories: 360, protein: 16, carbs: 38, fiber: 2, sugar: 8, fat: 16, saturatedFat: 5, sodium: 670 },

  { id: 'r_ino_cheeseburger', name: 'Cheeseburger', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 229, servingUnit: '1 burger', calories: 430, protein: 20, carbs: 40, fiber: 2, sugar: 9, fat: 21, saturatedFat: 8, sodium: 1080 },

  { id: 'r_ino_double_double', name: 'Double-Double', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 287, servingUnit: '1 burger', calories: 610, protein: 34, carbs: 42, fiber: 2, sugar: 9, fat: 34, saturatedFat: 15, sodium: 1670 },

  { id: 'r_ino_double_double_animal', name: 'Double-Double Animal Style', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 395, servingUnit: '1 burger', calories: 750, protein: 37, carbs: 53, fiber: 3, sugar: 17, fat: 45, saturatedFat: 18, sodium: 1440 },

  { id: 'r_ino_protein_style_cheeseburger', name: 'Protein Style Cheeseburger', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 231, servingUnit: '1 burger', calories: 280, protein: 16, carbs: 11, fiber: 2, sugar: 7, fat: 19, saturatedFat: 8, sodium: 800 },

  { id: 'r_ino_fries', name: 'French Fries', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 125, servingUnit: '1 order', calories: 360, protein: 6, carbs: 49, fiber: 6, sugar: 0, fat: 15, saturatedFat: 2, sodium: 150 },

  { id: 'r_ino_chocolate_shake_med', name: 'Chocolate Shake (Medium)', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 425, servingUnit: '1 medium (15 fl oz)', calories: 610, protein: 16, carbs: 74, fiber: 0, sugar: 61, fat: 30, saturatedFat: 19, sodium: 370 },

  { id: 'r_ino_strawberry_shake_med', name: 'Strawberry Shake (Medium)', brand: 'In-N-Out Burger', category: 'Restaurant', servingSize: 425, servingUnit: '1 medium (15 fl oz)', calories: 610, protein: 15, carbs: 74, fiber: 0, sugar: 63, fat: 30, saturatedFat: 19, sodium: 350 },

  // ══ CARL'S JR. / HARDEE'S ════════════════════════════════════════════════════

  { id: 'r_cjr_famous_star_cheese', name: 'Famous Star with Cheese', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 286, servingUnit: '1 burger', calories: 670, protein: 28, carbs: 57, fiber: 3, sugar: 10, fat: 37, saturatedFat: 13, sodium: 1210 },

  { id: 'r_cjr_double_famous_star', name: 'Double Famous Star with Cheese', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 390, servingUnit: '1 burger', calories: 1000, protein: 51, carbs: 57, fiber: 3, sugar: 10, fat: 64, saturatedFat: 25, sodium: 1680 },

  { id: 'r_cjr_big_carl', name: 'Big Carl', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 323, servingUnit: '1 burger', calories: 930, protein: 47, carbs: 55, fiber: 3, sugar: 9, fat: 58, saturatedFat: 23, sodium: 1390 },

  { id: 'r_cjr_charbroiled_chicken_club', name: 'Charbroiled Chicken Club Sandwich', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 265, servingUnit: '1 sandwich', calories: 580, protein: 36, carbs: 45, fiber: 3, sugar: 8, fat: 27, saturatedFat: 7, sodium: 1270 },

  { id: 'r_cjr_spicy_chicken', name: 'Spicy Chicken Sandwich', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 177, servingUnit: '1 sandwich', calories: 460, protein: 14, carbs: 47, fiber: 4, sugar: 5, fat: 24, saturatedFat: 4, sodium: 1360 },

  { id: 'r_cjr_natural_cut_fries_med', name: 'Natural-Cut Fries (Medium)', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 147, servingUnit: '1 medium', calories: 430, protein: 5, carbs: 55, fiber: 5, sugar: 0, fat: 21, saturatedFat: 4, sodium: 860 },

  { id: 'r_cjr_monster_biscuit', name: 'Monster Biscuit', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 298, servingUnit: '1 biscuit sandwich', calories: 850, protein: 31, carbs: 46, fiber: 1, sugar: 4, fat: 61, saturatedFat: 25, sodium: 2380 },

  { id: 'r_cjr_chicken_tenders_3pc', name: 'Hand-Breaded Chicken Tenders (3pc)', brand: "Carl's Jr.", category: 'Restaurant', servingSize: 128, servingUnit: '3 pieces', calories: 260, protein: 25, carbs: 13, fiber: 0, sugar: 0, fat: 13, saturatedFat: 2, sodium: 770 },

  // ══ DEL TACO ══════════════════════════════════════════════════════════════════

  { id: 'r_dt_del_taco_beef', name: 'Del Taco (beef)', brand: 'Del Taco', category: 'Restaurant', servingSize: 95, servingUnit: '1 taco', calories: 210, protein: 11, carbs: 19, fiber: 2, sugar: 1, fat: 11, saturatedFat: 4, sodium: 430 },

  { id: 'r_dt_classic_chicken_taco', name: 'Classic Chicken Taco', brand: 'Del Taco', category: 'Restaurant', servingSize: 85, servingUnit: '1 taco', calories: 170, protein: 10, carbs: 16, fiber: 1, sugar: 1, fat: 7, saturatedFat: 2, sodium: 400 },

  { id: 'r_dt_del_beef_burrito', name: 'Del Beef Burrito', brand: 'Del Taco', category: 'Restaurant', servingSize: 215, servingUnit: '1 burrito', calories: 500, protein: 27, carbs: 40, fiber: 3, sugar: 2, fat: 24, saturatedFat: 9, sodium: 810 },

  { id: 'r_dt_chicken_soft_taco', name: 'Chicken Soft Taco', brand: 'Del Taco', category: 'Restaurant', servingSize: 105, servingUnit: '1 taco', calories: 200, protein: 14, carbs: 21, fiber: 1, sugar: 2, fat: 7, saturatedFat: 2, sodium: 560 },

  { id: 'r_dt_epic_burrito_chicken', name: 'Epic Burrito (Chicken)', brand: 'Del Taco', category: 'Restaurant', servingSize: 375, servingUnit: '1 burrito', calories: 840, protein: 38, carbs: 90, fiber: 6, sugar: 4, fat: 36, saturatedFat: 9, sodium: 2070 },

  { id: 'r_dt_crinkle_fries_reg', name: 'Crinkle Cut Fries (Regular)', brand: 'Del Taco', category: 'Restaurant', servingSize: 170, servingUnit: '1 regular', calories: 320, protein: 4, carbs: 34, fiber: 4, sugar: 0, fat: 19, saturatedFat: 3, sodium: 370 },

  { id: 'r_dt_bfast_wrap_egg_cheese', name: 'Breakfast Toasted Wrap (Egg & Cheese)', brand: 'Del Taco', category: 'Restaurant', servingSize: 170, servingUnit: '1 wrap', calories: 370, protein: 12, carbs: 37, fiber: 2, sugar: 2, fat: 19, saturatedFat: 5, sodium: 810 },

  { id: 'r_dt_bean_cheese_burrito', name: 'Bean & Cheese Burrito', brand: 'Del Taco', category: 'Restaurant', servingSize: 198, servingUnit: '1 burrito', calories: 440, protein: 19, carbs: 57, fiber: 8, sugar: 2, fat: 14, saturatedFat: 5, sodium: 1040 },

  // ══ EL POLLO LOCO ═════════════════════════════════════════════════════════════

  { id: 'r_epl_grilled_breast', name: 'Fire-Grilled Chicken Breast', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 122, servingUnit: '1 piece', calories: 220, protein: 36, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 3, sodium: 620 },

  { id: 'r_epl_grilled_thigh', name: 'Fire-Grilled Chicken Thigh', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 88, servingUnit: '1 piece', calories: 210, protein: 21, carbs: 0, fiber: 0, sugar: 0, fat: 15, saturatedFat: 5, sodium: 320 },

  { id: 'r_epl_grilled_leg', name: 'Fire-Grilled Chicken Leg', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 45, servingUnit: '1 piece', calories: 80, protein: 12, carbs: 0, fiber: 0, sugar: 0, fat: 4, saturatedFat: 1, sodium: 170 },

  { id: 'r_epl_burrito_al_carbon', name: 'Burrito al Carbon (Chicken)', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 295, servingUnit: '1 burrito', calories: 490, protein: 26, carbs: 66, fiber: 4, sugar: 3, fat: 13, saturatedFat: 4, sodium: 1420 },

  { id: 'r_epl_pollo_bowl', name: 'Pollo Bowl (Chicken)', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 514, servingUnit: '1 bowl', calories: 530, protein: 36, carbs: 80, fiber: 10, sugar: 3, fat: 7, saturatedFat: 2, sodium: 1680 },

  { id: 'r_epl_avocado_salsa', name: 'Avocado Salsa', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 37, servingUnit: '1 serving', calories: 30, protein: 0, carbs: 2, fiber: 1, sugar: 0, fat: 3, saturatedFat: 1, sodium: 240 },

  { id: 'r_epl_refried_beans', name: 'Refried Beans', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 179, servingUnit: '1 side', calories: 270, protein: 14, carbs: 36, fiber: 10, sugar: 1, fat: 7, saturatedFat: 2, sodium: 730 },

  { id: 'r_epl_mexican_rice', name: 'Mexican Rice', brand: 'El Pollo Loco', category: 'Restaurant', servingSize: 128, servingUnit: '1 side', calories: 160, protein: 3, carbs: 32, fiber: 1, sugar: 1, fat: 2, saturatedFat: 0, sodium: 570 },

]
