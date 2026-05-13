// ─── Restaurant Menu Items — Batch 4 ─────────────────────────────────────────
// Chains: Jersey Mike's · Jimmy John's · Firehouse Subs · Potbelly
//         Moe's Southwest Grill · Qdoba · Jason's Deli · McAlister's Deli
//
// Sources: Official restaurant nutrition pages, fastfoodnutrition.org,
//          fatsecret.com, mynetdiary.com, myfooddiary.com (2024–2025 data)
// Serving sizes in grams where available; estimated from standard portions otherwise.

export const FOODS_RESTAURANT4 = [

  // ══ JERSEY MIKE'S ══════════════════════════════════════════════════════════
  // Regular = 7" sub on white roll (includes standard Mike's Way dressing)
  // Weights estimated ~255–290g based on comparable listed items

  { id: 'r_jm_turkey_prov_reg', name: '#7 Turkey & Provolone (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 270, servingUnit: '1 regular sub', calories: 780, protein: 44, carbs: 61, fiber: 4, sugar: 7, fat: 47, saturatedFat: 11, sodium: 2032 },

  { id: 'r_jm_club_sub_reg', name: '#8 Club Sub (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 290, servingUnit: '1 regular sub', calories: 1120, protein: 46, carbs: 63, fiber: 4, sugar: 8, fat: 79, saturatedFat: 17, sodium: 2582 },

  { id: 'r_jm_orig_italian_reg', name: '#13 Original Italian (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 285, servingUnit: '1 regular sub', calories: 940, protein: 45, carbs: 65, fiber: 4, sugar: 10, fat: 55, saturatedFat: 15, sodium: 2495 },

  { id: 'r_jm_big_kahuna_chkn_reg', name: '#56 Big Kahuna Chicken Cheese Steak (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 290, servingUnit: '1 regular sub', calories: 710, protein: 49, carbs: 67, fiber: 4, sugar: 11, fat: 28, saturatedFat: 13, sodium: 2384 },

  { id: 'r_jm_grilled_chkn_spinach_reg', name: 'Grilled Chicken & Spinach (Regular, Spinach Wrap)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 380, servingUnit: '1 regular wrap', calories: 740, protein: 40, carbs: 61, fiber: 3, sugar: 9, fat: 38, saturatedFat: 8, sodium: 1470 },

  { id: 'r_jm_blt_reg', name: 'BLT (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 260, servingUnit: '1 regular sub', calories: 710, protein: 20, carbs: 59, fiber: 4, sugar: 6, fat: 44, saturatedFat: 9, sodium: 1618 },

  { id: 'r_jm_tuna_fish_reg', name: 'Tuna Fish Sub (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 280, servingUnit: '1 regular sub', calories: 1020, protein: 32, carbs: 62, fiber: 5, sugar: 8, fat: 71, saturatedFat: 9, sodium: 1446 },

  { id: 'r_jm_chipotle_chkn_steak_reg', name: 'Chipotle Chicken Cheese Steak (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 285, servingUnit: '1 regular sub', calories: 930, protein: 47, carbs: 65, fiber: 3, sugar: 10, fat: 55, saturatedFat: 15, sodium: 2184 },

  { id: 'r_jm_club_supreme_reg', name: 'Club Supreme (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 290, servingUnit: '1 regular sub', calories: 1120, protein: 55, carbs: 62, fiber: 4, sugar: 7, fat: 79, saturatedFat: 16, sodium: 1964 },

  { id: 'r_jm_turkey_bacon_reg', name: 'Turkey & Bacon (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 285, servingUnit: '1 regular sub', calories: 1080, protein: 43, carbs: 62, fiber: 4, sugar: 7, fat: 79, saturatedFat: 16, sodium: 2288 },

  // Wheat bread note: adds ~20 cal and 4g carbs vs white; fiber increases ~1g
  { id: 'r_jm_wheat_bread_upgrade', name: 'Wheat Bread Upgrade (add to any sub)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 10, servingUnit: '1 upgrade', calories: 20, protein: 1, carbs: 4, fiber: 1, sugar: 0, fat: 0, saturatedFat: 0, sodium: 0 },

  { id: 'r_jm_giant_turkey_prov', name: 'Giant #7 Turkey & Provolone', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 530, servingUnit: '1 giant sub', calories: 1480, protein: 76, carbs: 120, fiber: 8, sugar: 12, fat: 89, saturatedFat: 19, sodium: 3623 },


  // ══ JIMMY JOHN'S ═══════════════════════════════════════════════════════════
  // Slim = 8" French bread, single meat + cheese (no veggies)
  // Regular = 8" French bread Giant Club sandwich (meat + cheese + veggies)

  { id: 'r_jj_pepe_slim', name: '#1 Pepe (Slim, French Bread)', brand: "Jimmy John's", category: 'Restaurant', servingSize: 185, servingUnit: '1 slim sub', calories: 470, protein: 28, carbs: 51, fiber: 2, sugar: 3, fat: 18, saturatedFat: 10, sodium: 1520 },

  { id: 'r_jj_big_john_slim', name: '#2 Big John (Slim, French Bread)', brand: "Jimmy John's", category: 'Restaurant', servingSize: 185, servingUnit: '1 slim sub', calories: 550, protein: 29, carbs: 51, fiber: 6, sugar: 2, fat: 25, saturatedFat: 4, sodium: 1080 },

  { id: 'r_jj_vegetarian_slim', name: '#6 Vegetarian (Slim, French Bread)', brand: "Jimmy John's", category: 'Restaurant', servingSize: 210, servingUnit: '1 slim sub', calories: 690, protein: 27, carbs: 60, fiber: 5, sugar: 5, fat: 39, saturatedFat: 11, sodium: 1250 },

  { id: 'r_jj_italian_night_club_reg', name: '#9 Italian Night Club (Regular 8")', brand: "Jimmy John's", category: 'Restaurant', servingSize: 300, servingUnit: '1 regular sub', calories: 990, protein: 48, carbs: 82, fiber: 6, sugar: 6, fat: 50, saturatedFat: 14, sodium: 2940 },

  { id: 'r_jj_hunters_club_reg', name: "#10 Hunter's Club (Regular 8\")", brand: "Jimmy John's", category: 'Restaurant', servingSize: 280, servingUnit: '1 regular sub', calories: 830, protein: 55, carbs: 70, fiber: 4, sugar: 4, fat: 34, saturatedFat: 8, sodium: 2080 },

  { id: 'r_jj_beach_club_reg', name: '#12 Beach Club (Regular 8")', brand: "Jimmy John's", category: 'Restaurant', servingSize: 295, servingUnit: '1 regular sub', calories: 860, protein: 45, carbs: 75, fiber: 4, sugar: 5, fat: 40, saturatedFat: 14, sodium: 2050 },

  { id: 'r_jj_bootlegger_club_reg', name: '#14 Bootlegger Club (Regular 8")', brand: "Jimmy John's", category: 'Restaurant', servingSize: 280, servingUnit: '1 regular sub', calories: 680, protein: 44, carbs: 71, fiber: 6, sugar: 2, fat: 23, saturatedFat: 4, sodium: 1890 },

  { id: 'r_jj_club_lulu_reg', name: '#16 Club Lulu (Regular 8")', brand: "Jimmy John's", category: 'Restaurant', servingSize: 270, servingUnit: '1 regular sub', calories: 690, protein: 35, carbs: 71, fiber: 6, sugar: 2, fat: 26, saturatedFat: 5, sodium: 1760 },

  { id: 'r_jj_italian_night_club_unwich', name: '#9 Italian Night Club (Unwich — Lettuce Wrap)', brand: "Jimmy John's", category: 'Restaurant', servingSize: 150, servingUnit: '1 unwich', calories: 600, protein: 33, carbs: 9, fiber: 1, sugar: 6, fat: 48, saturatedFat: 14, sodium: 2160 },

  { id: 'r_jj_gargantuan_reg', name: 'J.J. Gargantuan (Regular 8")', brand: "Jimmy John's", category: 'Restaurant', servingSize: 340, servingUnit: '1 regular sub', calories: 1080, protein: 78, carbs: 83, fiber: 5, sugar: 4, fat: 49, saturatedFat: 16, sodium: 3200 },


  // ══ FIREHOUSE SUBS ════════════════════════════════════════════════════════
  // Medium = approximately 8" sub on steamed bread

  { id: 'r_fhs_hook_ladder_med', name: 'Hook & Ladder (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 310, servingUnit: '1 medium sub', calories: 720, protein: 36, carbs: 62, fiber: 4, sugar: 15, fat: 36, saturatedFat: 9, sodium: 1900 },

  { id: 'r_fhs_engineer_med', name: 'Engineer (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 310, servingUnit: '1 medium sub', calories: 687, protein: 38, carbs: 60, fiber: 6, sugar: 9, fat: 35, saturatedFat: 8, sodium: 2025 },

  { id: 'r_fhs_hero_med', name: 'Firehouse Hero (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 330, servingUnit: '1 medium sub', calories: 770, protein: 48, carbs: 64, fiber: 4, sugar: 15, fat: 30, saturatedFat: 10, sodium: 2170 },

  { id: 'r_fhs_italian_med', name: 'Italian (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 335, servingUnit: '1 medium sub', calories: 939, protein: 39, carbs: 65, fiber: 4, sugar: 16, fat: 58, saturatedFat: 15, sodium: 2682 },

  { id: 'r_fhs_turkey_bacon_ranch_med', name: 'Turkey Bacon Ranch (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 320, servingUnit: '1 medium sub', calories: 831, protein: 40, carbs: 61, fiber: 4, sugar: 10, fat: 48, saturatedFat: 11, sodium: 2271 },

  { id: 'r_fhs_meatball_med', name: 'Meatball (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 340, servingUnit: '1 medium sub', calories: 834, protein: 37, carbs: 59, fiber: 4, sugar: 9, fat: 51, saturatedFat: 19, sodium: 1927 },

  { id: 'r_fhs_chicken_salad_med', name: 'Chicken Salad (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 320, servingUnit: '1 medium sub', calories: 820, protein: 34, carbs: 60, fiber: 3, sugar: 9, fat: 48, saturatedFat: 10, sodium: 1370 },

  { id: 'r_fhs_smokehouse_beef_brisket_med', name: 'Smokehouse Beef & Cheddar Brisket (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 330, servingUnit: '1 medium sub', calories: 890, protein: 31, carbs: 59, fiber: 2, sugar: 15, fat: 59, saturatedFat: 18, sodium: 1707 },

  { id: 'r_fhs_veggie_med', name: 'Veggie (Medium)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 305, servingUnit: '1 medium sub', calories: 723, protein: 24, carbs: 58, fiber: 5, sugar: 8, fat: 45, saturatedFat: 12, sodium: 1760 },

  { id: 'r_fhs_chili_large', name: 'Firehouse Chili (Large Bowl)', brand: 'Firehouse Subs', category: 'Restaurant', servingSize: 284, servingUnit: '1 large bowl (~10 oz)', calories: 300, protein: 18, carbs: 22, fiber: 5, sugar: 5, fat: 15, saturatedFat: 6, sodium: 850 },


  // ══ POTBELLY SANDWICH WORKS ════════════════════════════════════════════════
  // Regular (Original) = standard size on multigrain bread unless noted
  // Serving sizes estimated ~230–280g based on comparable items

  { id: 'r_pb_turkey_breast_reg', name: 'Turkey Breast (Regular, Multigrain)', brand: 'Potbelly', category: 'Restaurant', servingSize: 255, servingUnit: '1 regular sandwich', calories: 552, protein: 36, carbs: 61, fiber: 5, sugar: 4, fat: 22, saturatedFat: 7, sodium: 1392 },

  { id: 'r_pb_italian_reg', name: 'Italian (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 265, servingUnit: '1 regular sandwich', calories: 762, protein: 31, carbs: 59, fiber: 5, sugar: 6, fat: 47, saturatedFat: 15, sodium: 1934 },

  { id: 'r_pb_wreck_reg', name: 'A Wreck (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 265, servingUnit: '1 regular sandwich', calories: 646, protein: 35, carbs: 60, fiber: 5, sugar: 5, fat: 32, saturatedFat: 11, sodium: 1525 },

  // A Wreck Jr = smaller portion (~half the Wreck)
  { id: 'r_pb_wreck_jr_reg', name: 'A Wreck Jr. (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 200, servingUnit: '1 regular sandwich', calories: 490, protein: 26, carbs: 46, fiber: 4, sugar: 4, fat: 22, saturatedFat: 8, sodium: 1150 },

  { id: 'r_pb_tuna_salad_reg', name: 'Tuna Salad (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 250, servingUnit: '1 regular sandwich', calories: 532, protein: 37, carbs: 58, fiber: 6, sugar: 4, fat: 19, saturatedFat: 7, sodium: 695 },

  { id: 'r_pb_chicken_salad_reg', name: 'Chicken Salad (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 255, servingUnit: '1 regular sandwich', calories: 601, protein: 37, carbs: 58, fiber: 6, sugar: 4, fat: 27, saturatedFat: 7, sodium: 801 },

  // Skinny = same fillings on thin-sliced multigrain bread
  { id: 'r_pb_skinny_reg', name: 'Skinny Turkey (T-K-Y Skinny)', brand: 'Potbelly', category: 'Restaurant', servingSize: 150, servingUnit: '1 skinny sandwich', calories: 301, protein: 24, carbs: 41, fiber: 3, sugar: 3, fat: 7, saturatedFat: 3, sodium: 875 },

  // Grilled Chicken & Hummus (Mediterranean) — grilled chicken, hummus, feta, cucumbers, peppers on multigrain
  { id: 'r_pb_grilled_chkn_hummus_reg', name: 'Grilled Chicken & Hummus (Regular)', brand: 'Potbelly', category: 'Restaurant', servingSize: 270, servingUnit: '1 regular sandwich', calories: 621, protein: 45, carbs: 55, fiber: 7, sugar: 5, fat: 23, saturatedFat: 6, sodium: 1290 },


  // ══ MOE'S SOUTHWEST GRILL ═════════════════════════════════════════════════
  // Full burritos are made-to-order; values reflect standard build with flour tortilla,
  // seasoned rice, black beans, protein, cheese, salsa, sour cream.
  // Component items are per standard restaurant serving portion.

  { id: 'r_moes_joey_ground_beef', name: 'Joey Bag of Donuts Burrito (Ground Beef)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 450, servingUnit: '1 burrito', calories: 875, protein: 38, carbs: 89, fiber: 16, sugar: 6, fat: 30, saturatedFat: 12, sodium: 2100 },

  { id: 'r_moes_homewrecker_chicken', name: 'Homewrecker Burrito (Chicken)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 430, servingUnit: '1 burrito', calories: 845, protein: 50, carbs: 85, fiber: 16, sugar: 7, fat: 34, saturatedFat: 11, sodium: 1614 },

  { id: 'r_moes_art_vandalay_tofu', name: 'Art Vandalay Burrito (Tofu)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 430, servingUnit: '1 burrito', calories: 775, protein: 26, carbs: 92, fiber: 20, sugar: 7, fat: 29, saturatedFat: 14, sodium: 2095 },

  // Stack = quesadilla with chicken, cheese, pico, sour cream in a flour tortilla
  { id: 'r_moes_stack_quesadilla', name: 'Stack Quesadilla (Chicken)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 280, servingUnit: '1 quesadilla', calories: 680, protein: 40, carbs: 50, fiber: 3, sugar: 3, fat: 35, saturatedFat: 14, sodium: 1430 },

  // Overachiever Salad = greens, chicken, black beans, shredded cheese, pico, jalapeños
  // (no crispy bowl or dressing)
  { id: 'r_moes_overachiever_salad_chicken', name: 'Overachiever Salad (Chicken, no bowl/dressing)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 310, servingUnit: '1 salad', calories: 462, protein: 42, carbs: 26, fiber: 13, sugar: 1, fat: 20, saturatedFat: 7, sodium: 1075 },

  // Individual components
  { id: 'r_moes_white_rice', name: 'Seasoned White Rice', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 113, servingUnit: '1 serving (4 oz)', calories: 150, protein: 3, carbs: 33, fiber: 1, sugar: 1, fat: 1, saturatedFat: 1, sodium: 190 },

  { id: 'r_moes_brown_rice', name: 'Brown Rice (Seasoned)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 113, servingUnit: '1 serving (4 oz)', calories: 160, protein: 3, carbs: 34, fiber: 2, sugar: 0, fat: 1, saturatedFat: 0, sodium: 200 },

  { id: 'r_moes_ground_beef', name: 'Ground Beef (component)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 99, servingUnit: '1 serving (3.5 oz)', calories: 124, protein: 22, carbs: 10, fiber: 0, sugar: 0, fat: 14, saturatedFat: 5, sodium: 480 },

  { id: 'r_moes_chicken', name: 'Adobo Chicken (component)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 57, servingUnit: '1 serving (2 oz)', calories: 148, protein: 19, carbs: 2, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 280 },

  { id: 'r_moes_pinto_beans', name: 'Pinto Beans', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 85, servingUnit: '1 serving (3 oz)', calories: 120, protein: 8, carbs: 21, fiber: 10, sugar: 0, fat: 1, saturatedFat: 1, sodium: 145 },

  { id: 'r_moes_queso', name: 'Queso (cup)', brand: "Moe's Southwest Grill", category: 'Restaurant', servingSize: 57, servingUnit: '1 serving (2 oz)', calories: 197, protein: 6, carbs: 6, fiber: 0, sugar: 1, fat: 11, saturatedFat: 6, sodium: 430 },


  // ══ QDOBA MEXICAN EATS ════════════════════════════════════════════════════
  // Component items use standard restaurant serving sizes (from 2024 official nutrition brochure)

  { id: 'r_qdb_grilled_chicken', name: 'Grilled Chicken (component)', brand: 'Qdoba', category: 'Restaurant', servingSize: 50, servingUnit: '1 serving (1.75 oz)', calories: 90, protein: 12, carbs: 1, fiber: 0, sugar: 0, fat: 5, saturatedFat: 2, sodium: 170 },

  { id: 'r_qdb_pulled_pork', name: 'Pulled Pork (component)', brand: 'Qdoba', category: 'Restaurant', servingSize: 57, servingUnit: '1 serving (2 oz)', calories: 60, protein: 8, carbs: 0, fiber: 0, sugar: 0, fat: 3, saturatedFat: 2, sodium: 320 },

  { id: 'r_qdb_ground_beef', name: 'Ground Beef (component)', brand: 'Qdoba', category: 'Restaurant', servingSize: 99, servingUnit: '1 serving (3.5 oz)', calories: 190, protein: 15, carbs: 1, fiber: 0, sugar: 0, fat: 12, saturatedFat: 5, sodium: 480 },

  { id: 'r_qdb_black_beans', name: 'Seasoned Black Beans', brand: 'Qdoba', category: 'Restaurant', servingSize: 57, servingUnit: '1 serving (2 oz)', calories: 70, protein: 5, carbs: 12, fiber: 3, sugar: 0, fat: 0, saturatedFat: 0, sodium: 170 },

  { id: 'r_qdb_cilantro_lime_rice', name: 'Mexican Gumbo Rice (Cilantro Lime)', brand: 'Qdoba', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving (4 oz)', calories: 190, protein: 3, carbs: 38, fiber: 1, sugar: 0, fat: 3, saturatedFat: 1, sodium: 390 },

  { id: 'r_qdb_3_cheese_queso', name: '3-Cheese Queso (4 oz)', brand: 'Qdoba', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving (4 oz)', calories: 190, protein: 6, carbs: 6, fiber: 0, sugar: 1, fat: 15, saturatedFat: 10, sodium: 710 },

  { id: 'r_qdb_guacamole', name: 'Handcrafted Guacamole (2 oz)', brand: 'Qdoba', category: 'Restaurant', servingSize: 57, servingUnit: '1 serving (2 oz)', calories: 80, protein: 1, carbs: 5, fiber: 3, sugar: 0, fat: 8, saturatedFat: 1, sodium: 110 },

  { id: 'r_qdb_flour_tortilla_lg', name: 'Flour Tortilla (Large, 12.5")', brand: 'Qdoba', category: 'Restaurant', servingSize: 102, servingUnit: '1 tortilla', calories: 300, protein: 8, carbs: 52, fiber: 3, sugar: 2, fat: 7, saturatedFat: 3, sodium: 760 },

  // Breakfast Burrito: flour tortilla + scrambled eggs + sausage + 3-cheese queso + potatoes
  { id: 'r_qdb_breakfast_burrito_egg_sausage', name: 'Breakfast Burrito (Egg, Sausage & Cheese)', brand: 'Qdoba', category: 'Restaurant', servingSize: 320, servingUnit: '1 burrito', calories: 750, protein: 30, carbs: 68, fiber: 3, sugar: 3, fat: 38, saturatedFat: 16, sodium: 1480 },

  // Protein Bowl with Chicken: chicken, rice, black beans, fajita veg, salsa, in a bowl (no tortilla)
  { id: 'r_qdb_protein_bowl_chicken', name: 'Protein Bowl with Chicken (standard build)', brand: 'Qdoba', category: 'Restaurant', servingSize: 546, servingUnit: '1 bowl', calories: 610, protein: 44, carbs: 48, fiber: 0, sugar: 9, fat: 29, saturatedFat: 8, sodium: 1830 },


  // ══ JASON'S DELI ══════════════════════════════════════════════════════════
  // Half = half sandwich portion; nutrition from nutrition-charts.com (2024 data)

  { id: 'r_jd_turkey_wrap_half', name: 'Turkey Wrap (Half)', brand: "Jason's Deli", category: 'Restaurant', servingSize: 190, servingUnit: '1 half wrap', calories: 190, protein: 11, carbs: 21, fiber: 4, sugar: 1, fat: 8, saturatedFat: 2, sodium: 520 },

  { id: 'r_jd_reuben_whole', name: 'Reuben Sandwich (Whole)', brand: "Jason's Deli", category: 'Restaurant', servingSize: 420, servingUnit: '1 whole sandwich', calories: 870, protein: 79, carbs: 55, fiber: 7, sugar: 4, fat: 36, saturatedFat: 14, sodium: 3010 },

  { id: 'r_jd_club_half', name: 'Club Sandwich (Half)', brand: "Jason's Deli", category: 'Restaurant', servingSize: 210, servingUnit: '1 half sandwich', calories: 360, protein: 20, carbs: 23, fiber: 1, sugar: 4, fat: 20, saturatedFat: 8, sodium: 690 },

  { id: 'r_jd_muffuletta_quarter', name: 'Muffuletta (1/4)', brand: "Jason's Deli", category: 'Restaurant', servingSize: 215, servingUnit: '1 quarter', calories: 510, protein: 26, carbs: 41, fiber: 3, sugar: 2, fat: 26, saturatedFat: 7, sodium: 2130 },

  { id: 'r_jd_chicken_pot_pie', name: 'Chicken Pot Pie', brand: "Jason's Deli", category: 'Restaurant', servingSize: 280, servingUnit: '1 serving', calories: 310, protein: 16, carbs: 23, fiber: 3, sugar: 3, fat: 18, saturatedFat: 8, sodium: 1290 },

  { id: 'r_jd_tomato_basil_soup_cup', name: 'Tomato Basil Soup (Cup)', brand: "Jason's Deli", category: 'Restaurant', servingSize: 227, servingUnit: '1 cup', calories: 340, protein: 8, carbs: 21, fiber: 3, sugar: 8, fat: 25, saturatedFat: 14, sodium: 950 },

  { id: 'r_jd_fruit_cup', name: 'Fruit Cup', brand: "Jason's Deli", category: 'Restaurant', servingSize: 226, servingUnit: '1 serving', calories: 390, protein: 5, carbs: 79, fiber: 8, sugar: 62, fat: 8, saturatedFat: 5, sodium: 45 },

  { id: 'r_jd_mac_cheese_kids', name: "Mac & Cheese (Kids)", brand: "Jason's Deli", category: 'Restaurant', servingSize: 230, servingUnit: '1 kids serving', calories: 470, protein: 19, carbs: 44, fiber: 0, sugar: 4, fat: 24, saturatedFat: 15, sodium: 920 },


  // ══ MCALISTER'S DELI ══════════════════════════════════════════════════════
  // Half = half sandwich unless noted (whole = full sandwich)

  // Club McAlister half (~half of the full 770-cal sandwich)
  { id: 'r_mca_club_mcalister_half', name: "Club McAlister Sandwich (Half)", brand: "McAlister's Deli", category: 'Restaurant', servingSize: 220, servingUnit: '1 half sandwich', calories: 390, protein: 22, carbs: 37, fiber: 2, sugar: 4, fat: 18, saturatedFat: 7, sodium: 1050 },

  // Turkey Melt half (~half of 530-cal full sandwich)
  { id: 'r_mca_turkey_melt_half', name: 'Turkey Melt (Half)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 210, servingUnit: '1 half sandwich', calories: 530, protein: 36, carbs: 43, fiber: 2, sugar: 5, fat: 21, saturatedFat: 8, sodium: 1380 },

  // Grilled Chicken Sandwich (full = 620 cal; half portion listed)
  { id: 'r_mca_grilled_chicken_half', name: 'Grilled Chicken Sandwich (Half)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 215, servingUnit: '1 half sandwich', calories: 310, protein: 23, carbs: 24, fiber: 1, sugar: 6, fat: 14, saturatedFat: 7, sodium: 500 },

  // Southwest Turkey Wrap (whole)
  { id: 'r_mca_sw_turkey_wrap_whole', name: 'Southwest Turkey Wrap (Whole)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 340, servingUnit: '1 whole wrap', calories: 680, protein: 40, carbs: 62, fiber: 6, sugar: 5, fat: 26, saturatedFat: 7, sodium: 1850 },

  // Spud Max = giant loaded baked potato with broccoli & cheddar sauce + all toppings
  { id: 'r_mca_spud_max', name: 'Spud Max (Loaded Baked Potato)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 700, servingUnit: '1 potato', calories: 1090, protein: 45, carbs: 135, fiber: 14, sugar: 11, fat: 42, saturatedFat: 23, sodium: 1430 },

  // Chicken Noodle Soup cup
  { id: 'r_mca_chicken_noodle_soup_cup', name: 'Chicken Noodle Soup (Cup)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 227, servingUnit: '1 cup', calories: 90, protein: 7, carbs: 13, fiber: 1, sugar: 1, fat: 2, saturatedFat: 1, sodium: 810 },

  // Famous Sweet Tea 16 oz
  { id: 'r_mca_sweet_tea_16oz', name: "McAlister's Famous Sweet Tea (16 oz)", brand: "McAlister's Deli", category: 'Restaurant', servingSize: 473, servingUnit: '16 fl oz', calories: 150, protein: 0, carbs: 39, fiber: 0, sugar: 39, fat: 0, saturatedFat: 0, sodium: 15 },

  // Harvest Chicken Salad (contains pecans) — half sandwich
  { id: 'r_mca_pecan_chicken_salad_half', name: 'Pecan Chicken Salad Sandwich (Half)', brand: "McAlister's Deli", category: 'Restaurant', servingSize: 175, servingUnit: '1 half sandwich', calories: 341, protein: 11, carbs: 26, fiber: 2, sugar: 8, fat: 22, saturatedFat: 6, sodium: 356 },

]
