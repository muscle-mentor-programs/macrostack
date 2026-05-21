// ─── Restaurant Menu Items ────────────────────────────────────────────────────
// Nutrition data sourced from each chain's official nutrition page / FDA-compliant
// posted information.  Values are per full menu item as served unless noted.
// Restaurant items use category: 'Restaurant' for easy filtering.

export const FOODS_RESTAURANT = [

  // ══════════════════════════════════════════════════════════════════════════
  // McDONALD'S
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_mcd_big_mac',            name: 'Big Mac',                         brand: "McDonald's", category: 'Restaurant', servingSize: 212, servingUnit: '1 sandwich', calories: 550, protein: 25, carbs: 45, fiber: 3, sugar: 9,  fat: 30, saturatedFat: 11, sodium: 1010 },
  { id: 'r_mcd_qpc',                name: 'Quarter Pounder with Cheese',     brand: "McDonald's", category: 'Restaurant', servingSize: 199, servingUnit: '1 sandwich', calories: 520, protein: 30, carbs: 42, fiber: 2, sugar: 13, fat: 26, saturatedFat: 12, sodium: 1090 },
  { id: 'r_mcd_mcdouble',           name: 'McDouble',                        brand: "McDonald's", category: 'Restaurant', servingSize: 160, servingUnit: '1 sandwich', calories: 400, protein: 22, carbs: 36, fiber: 2, sugar: 7,  fat: 20, saturatedFat: 9,  sodium: 820  },
  { id: 'r_mcd_mcchicken',          name: 'McChicken',                       brand: "McDonald's", category: 'Restaurant', servingSize: 147, servingUnit: '1 sandwich', calories: 400, protein: 14, carbs: 40, fiber: 2, sugar: 5,  fat: 21, saturatedFat: 4,  sodium: 800  },
  { id: 'r_mcd_egg_mcmuffin',       name: 'Egg McMuffin',                    brand: "McDonald's", category: 'Restaurant', servingSize: 137, servingUnit: '1 sandwich', calories: 310, protein: 17, carbs: 30, fiber: 2, sugar: 4,  fat: 13, saturatedFat: 5,  sodium: 770  },
  { id: 'r_mcd_sausage_mcmuffin',   name: 'Sausage McMuffin with Egg',       brand: "McDonald's", category: 'Restaurant', servingSize: 165, servingUnit: '1 sandwich', calories: 480, protein: 21, carbs: 30, fiber: 2, sugar: 3,  fat: 29, saturatedFat: 10, sodium: 920  },
  { id: 'r_mcd_nuggets_10pc',       name: 'Chicken McNuggets (10 pc)',       brand: "McDonald's", category: 'Restaurant', servingSize: 170, servingUnit: '10 pieces',  calories: 420, protein: 25, carbs: 27, fiber: 2, sugar: 1,  fat: 25, saturatedFat: 4.5,sodium: 980  },
  { id: 'r_mcd_filet_o_fish',       name: 'Filet-O-Fish',                    brand: "McDonald's", category: 'Restaurant', servingSize: 142, servingUnit: '1 sandwich', calories: 400, protein: 17, carbs: 38, fiber: 2, sugar: 5,  fat: 20, saturatedFat: 4.5,sodium: 610  },
  { id: 'r_mcd_fries_medium',       name: 'French Fries (Medium)',           brand: "McDonald's", category: 'Restaurant', servingSize: 117, servingUnit: '1 medium',   calories: 320, protein: 4,  carbs: 44, fiber: 4, sugar: 0,  fat: 15, saturatedFat: 2,  sodium: 260  },
  { id: 'r_mcd_fries_large',        name: 'French Fries (Large)',            brand: "McDonald's", category: 'Restaurant', servingSize: 154, servingUnit: '1 large',    calories: 490, protein: 7,  carbs: 66, fiber: 6, sugar: 0,  fat: 23, saturatedFat: 3,  sodium: 400  },
  { id: 'r_mcd_hotcakes',           name: 'Hotcakes (3 pancakes)',           brand: "McDonald's", category: 'Restaurant', servingSize: 245, servingUnit: '3 pancakes', calories: 580, protein: 15, carbs: 102,fiber: 3, sugar: 36, fat: 15, saturatedFat: 5,  sodium: 750  },
  { id: 'r_mcd_grilled_chicken',    name: 'Artisan Grilled Chicken Sandwich',brand: "McDonald's", category: 'Restaurant', servingSize: 215, servingUnit: '1 sandwich', calories: 380, protein: 37, carbs: 44, fiber: 3, sugar: 11, fat: 7,  saturatedFat: 1.5,sodium: 1040 },
  { id: 'r_mcd_mcflurry_oreo',      name: 'McFlurry with Oreo Cookies',      brand: "McDonald's", category: 'Restaurant', servingSize: 326, servingUnit: '12 oz cup',  calories: 510, protein: 12, carbs: 80, fiber: 1, sugar: 67, fat: 17, saturatedFat: 9,  sodium: 340  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHICK-FIL-A
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_cfa_original',           name: 'Chick-fil-A Chicken Sandwich',    brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 185, servingUnit: '1 sandwich', calories: 440, protein: 28, carbs: 40, fiber: 1, sugar: 6,  fat: 19, saturatedFat: 4,  sodium: 1350 },
  { id: 'r_cfa_spicy_deluxe',       name: 'Spicy Deluxe Sandwich',           brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 232, servingUnit: '1 sandwich', calories: 550, protein: 35, carbs: 43, fiber: 2, sugar: 8,  fat: 27, saturatedFat: 7,  sodium: 1760 },
  { id: 'r_cfa_grilled',            name: 'Grilled Chicken Sandwich',        brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 209, servingUnit: '1 sandwich', calories: 380, protein: 37, carbs: 40, fiber: 2, sugar: 8,  fat: 11, saturatedFat: 3,  sodium: 1120 },
  { id: 'r_cfa_nuggets_8pc',        name: 'Chicken Nuggets (8 pc)',          brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 113, servingUnit: '8 pieces',   calories: 260, protein: 26, carbs: 12, fiber: 0, sugar: 1,  fat: 12, saturatedFat: 2.5,sodium: 1080 },
  { id: 'r_cfa_strips_3pc',         name: 'Chicken Strips (3 pc)',           brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 138, servingUnit: '3 strips',   calories: 400, protein: 35, carbs: 28, fiber: 2, sugar: 1,  fat: 16, saturatedFat: 3,  sodium: 1290 },
  { id: 'r_cfa_waffle_fries_med',   name: 'Waffle Fries (Medium)',           brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 125, servingUnit: '1 medium',   calories: 430, protein: 6,  carbs: 57, fiber: 7, sugar: 1,  fat: 21, saturatedFat: 3.5,sodium: 280  },
  { id: 'r_cfa_egg_white_grill',    name: 'Egg White Grill (Breakfast)',     brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 165, servingUnit: '1 sandwich', calories: 300, protein: 26, carbs: 30, fiber: 1, sugar: 5,  fat: 7,  saturatedFat: 2,  sodium: 970  },
  { id: 'r_cfa_hash_browns',        name: 'Hash Browns',                     brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 71,  servingUnit: '1 serving',  calories: 270, protein: 3,  carbs: 32, fiber: 3, sugar: 0,  fat: 15, saturatedFat: 2.5,sodium: 490  },
  { id: 'r_cfa_mac_cheese',         name: 'Mac & Cheese',                    brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 226, servingUnit: '1 medium',   calories: 450, protein: 18, carbs: 45, fiber: 1, sugar: 8,  fat: 23, saturatedFat: 12, sodium: 1050 },
  { id: 'r_cfa_cobb_salad_grilled', name: 'Cobb Salad w/ Grilled Chicken',  brand: 'Chick-fil-A', category: 'Restaurant', servingSize: 410, servingUnit: '1 salad',    calories: 500, protein: 42, carbs: 22, fiber: 5, sugar: 9,  fat: 27, saturatedFat: 10, sodium: 1390 },

  // ══════════════════════════════════════════════════════════════════════════
  // CHIPOTLE — individual ingredients (build your own bowl/burrito)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_chp_flour_tortilla',     name: 'Flour Tortilla (Burrito)',        brand: 'Chipotle', category: 'Restaurant', servingSize: 117, servingUnit: '1 tortilla',  calories: 320, protein: 8,  carbs: 51, fiber: 2, sugar: 1,  fat: 9,  saturatedFat: 3.5,sodium: 700  },
  { id: 'r_chp_white_rice',         name: 'Cilantro-Lime White Rice',        brand: 'Chipotle', category: 'Restaurant', servingSize: 115, servingUnit: '1 serving',   calories: 210, protein: 4,  carbs: 40, fiber: 1, sugar: 0,  fat: 3,  saturatedFat: 0.5,sodium: 390  },
  { id: 'r_chp_brown_rice',         name: 'Cilantro-Lime Brown Rice',        brand: 'Chipotle', category: 'Restaurant', servingSize: 115, servingUnit: '1 serving',   calories: 210, protein: 5,  carbs: 40, fiber: 4, sugar: 0,  fat: 4,  saturatedFat: 0.5,sodium: 245  },
  { id: 'r_chp_black_beans',        name: 'Black Beans',                     brand: 'Chipotle', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 130, protein: 8,  carbs: 23, fiber: 8, sugar: 1,  fat: 1,  saturatedFat: 0,  sodium: 220  },
  { id: 'r_chp_pinto_beans',        name: 'Pinto Beans',                     brand: 'Chipotle', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 130, protein: 8,  carbs: 23, fiber: 8, sugar: 1,  fat: 1,  saturatedFat: 0,  sodium: 200  },
  { id: 'r_chp_chicken',            name: 'Chicken (Adobo)',                 brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 180, protein: 32, carbs: 1,  fiber: 0, sugar: 0,  fat: 7,  saturatedFat: 2,  sodium: 350  },
  { id: 'r_chp_steak',              name: 'Steak',                           brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 150, protein: 21, carbs: 1,  fiber: 0, sugar: 0,  fat: 6,  saturatedFat: 2.5,sodium: 285  },
  { id: 'r_chp_barbacoa',           name: 'Barbacoa',                        brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 170, protein: 24, carbs: 2,  fiber: 0, sugar: 0,  fat: 7,  saturatedFat: 3,  sodium: 530  },
  { id: 'r_chp_carnitas',           name: 'Carnitas',                        brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 210, protein: 23, carbs: 1,  fiber: 0, sugar: 0,  fat: 12, saturatedFat: 4.5,sodium: 400  },
  { id: 'r_chp_sofritas',           name: 'Sofritas (Plant-Based)',          brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 150, protein: 8,  carbs: 9,  fiber: 1, sugar: 2,  fat: 10, saturatedFat: 1.5,sodium: 480  },
  { id: 'r_chp_fajita_veggies',     name: 'Fajita Vegetables',               brand: 'Chipotle', category: 'Restaurant', servingSize: 91,  servingUnit: '1 serving',   calories: 20,  protein: 0,  carbs: 4,  fiber: 1, sugar: 2,  fat: 0.5,saturatedFat: 0,  sodium: 175  },
  { id: 'r_chp_salsa_fresh',        name: 'Fresh Tomato Salsa',              brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 25,  protein: 1,  carbs: 4,  fiber: 1, sugar: 2,  fat: 0,  saturatedFat: 0,  sodium: 470  },
  { id: 'r_chp_salsa_corn',         name: 'Roasted Chili-Corn Salsa',        brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 80,  protein: 3,  carbs: 16, fiber: 2, sugar: 8,  fat: 1,  saturatedFat: 0,  sodium: 360  },
  { id: 'r_chp_salsa_green',        name: 'Tomatillo-Green Chili Salsa',     brand: 'Chipotle', category: 'Restaurant', servingSize: 38,  servingUnit: '1 serving',   calories: 15,  protein: 0,  carbs: 3,  fiber: 0, sugar: 2,  fat: 0,  saturatedFat: 0,  sodium: 230  },
  { id: 'r_chp_salsa_red',          name: 'Tomatillo-Red Chili Salsa',       brand: 'Chipotle', category: 'Restaurant', servingSize: 38,  servingUnit: '1 serving',   calories: 30,  protein: 1,  carbs: 4,  fiber: 0, sugar: 3,  fat: 1,  saturatedFat: 0,  sodium: 510  },
  { id: 'r_chp_cheese',             name: 'Cheese (Shredded Monterey Jack)', brand: 'Chipotle', category: 'Restaurant', servingSize: 28,  servingUnit: '1 serving',   calories: 110, protein: 7,  carbs: 0,  fiber: 0, sugar: 0,  fat: 9,  saturatedFat: 5,  sodium: 180  },
  { id: 'r_chp_sour_cream',         name: 'Sour Cream',                      brand: 'Chipotle', category: 'Restaurant', servingSize: 57,  servingUnit: '1 serving',   calories: 110, protein: 2,  carbs: 2,  fiber: 0, sugar: 2,  fat: 9,  saturatedFat: 6,  sodium: 30   },
  { id: 'r_chp_guac',               name: 'Guacamole',                       brand: 'Chipotle', category: 'Restaurant', servingSize: 113, servingUnit: '1 serving',   calories: 230, protein: 2,  carbs: 11, fiber: 7, sugar: 1,  fat: 22, saturatedFat: 3,  sodium: 330  },
  { id: 'r_chp_lettuce',            name: 'Romaine Lettuce',                 brand: 'Chipotle', category: 'Restaurant', servingSize: 28,  servingUnit: '1 serving',   calories: 5,   protein: 0,  carbs: 1,  fiber: 0, sugar: 0,  fat: 0,  saturatedFat: 0,  sodium: 0    },
  { id: 'r_chp_chips',              name: 'Tortilla Chips',                  brand: 'Chipotle', category: 'Restaurant', servingSize: 99,  servingUnit: '1 serving',   calories: 540, protein: 7,  carbs: 73, fiber: 5, sugar: 1,  fat: 24, saturatedFat: 4,  sodium: 420  },

  // ══════════════════════════════════════════════════════════════════════════
  // COSTA VIDA
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_cv_sweet_pork',          name: 'Sweet Pork',                      brand: 'Costa Vida', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 210, protein: 18, carbs: 17, fiber: 0, sugar: 16, fat: 8,  saturatedFat: 3,  sodium: 560  },
  { id: 'r_cv_grilled_chicken',     name: 'Grilled Chicken',                 brand: 'Costa Vida', category: 'Restaurant', servingSize: 115, servingUnit: '1 serving',   calories: 180, protein: 30, carbs: 3,  fiber: 0, sugar: 1,  fat: 5,  saturatedFat: 1,  sodium: 500  },
  { id: 'r_cv_grilled_steak',       name: 'Grilled Steak',                   brand: 'Costa Vida', category: 'Restaurant', servingSize: 115, servingUnit: '1 serving',   calories: 230, protein: 28, carbs: 4,  fiber: 0, sugar: 2,  fat: 11, saturatedFat: 4,  sodium: 530  },
  { id: 'r_cv_cilantro_lime_rice',  name: 'Cilantro Lime Rice',              brand: 'Costa Vida', category: 'Restaurant', servingSize: 168, servingUnit: '1 serving',   calories: 200, protein: 4,  carbs: 38, fiber: 2, sugar: 2,  fat: 3,  saturatedFat: 0.5,sodium: 530  },
  { id: 'r_cv_black_beans',         name: 'Black Beans',                     brand: 'Costa Vida', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 100, protein: 7,  carbs: 20, fiber: 8, sugar: 0,  fat: 0.5,saturatedFat: 0,  sodium: 280  },
  { id: 'r_cv_pinto_beans',         name: 'Pinto Beans',                     brand: 'Costa Vida', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 100, protein: 6,  carbs: 19, fiber: 6, sugar: 1,  fat: 0.5,saturatedFat: 0,  sodium: 290  },
  { id: 'r_cv_fresh_lime_tortilla', name: 'Fresh-Baked Lime Tortilla',       brand: 'Costa Vida', category: 'Restaurant', servingSize: 105, servingUnit: '1 tortilla',  calories: 270, protein: 7,  carbs: 50, fiber: 2, sugar: 1,  fat: 5,  saturatedFat: 2,  sodium: 420  },
  { id: 'r_cv_burrito_sweet_pork',  name: 'Sweet Pork Burrito (Full)',       brand: 'Costa Vida', category: 'Restaurant', servingSize: 544, servingUnit: '1 burrito',   calories: 950, protein: 40, carbs: 125,fiber: 11,sugar: 24, fat: 32, saturatedFat: 11, sodium: 2090 },
  { id: 'r_cv_bowl_sweet_pork',     name: 'Sweet Pork Salad Bowl',           brand: 'Costa Vida', category: 'Restaurant', servingSize: 476, servingUnit: '1 bowl',      calories: 680, protein: 32, carbs: 89, fiber: 10,sugar: 20, fat: 22, saturatedFat: 7,  sodium: 1680 },
  { id: 'r_cv_nachos_sweet_pork',   name: 'Nachos with Sweet Pork',          brand: 'Costa Vida', category: 'Restaurant', servingSize: 500, servingUnit: '1 plate',     calories: 1020,protein: 38, carbs: 108,fiber: 12,sugar: 15, fat: 49, saturatedFat: 17, sodium: 2060 },
  { id: 'r_cv_quesadilla',          name: 'Cheese Quesadilla',               brand: 'Costa Vida', category: 'Restaurant', servingSize: 320, servingUnit: '1 quesadilla',calories: 730, protein: 29, carbs: 77, fiber: 6, sugar: 4,  fat: 36, saturatedFat: 18, sodium: 1440 },
  { id: 'r_cv_guac',                name: 'Guacamole',                       brand: 'Costa Vida', category: 'Restaurant', servingSize: 85,  servingUnit: '1 serving',   calories: 150, protein: 2,  carbs: 8,  fiber: 5, sugar: 1,  fat: 14, saturatedFat: 2,  sodium: 210  },
  { id: 'r_cv_chips_salsa',         name: 'Chips & Salsa',                   brand: 'Costa Vida', category: 'Restaurant', servingSize: 130, servingUnit: '1 serving',   calories: 450, protein: 6,  carbs: 63, fiber: 5, sugar: 2,  fat: 19, saturatedFat: 3,  sodium: 680  },

  // ══════════════════════════════════════════════════════════════════════════
  // TACO BELL
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_tb_crunchy_taco',        name: 'Crunchy Taco',                    brand: 'Taco Bell', category: 'Restaurant', servingSize: 78,  servingUnit: '1 taco',      calories: 170, protein: 8,  carbs: 13, fiber: 3, sugar: 1,  fat: 9,  saturatedFat: 3.5,sodium: 310  },
  { id: 'r_tb_soft_taco_beef',      name: 'Soft Taco (Beef)',                brand: 'Taco Bell', category: 'Restaurant', servingSize: 99,  servingUnit: '1 taco',      calories: 180, protein: 9,  carbs: 19, fiber: 2, sugar: 2,  fat: 8,  saturatedFat: 3,  sodium: 510  },
  { id: 'r_tb_burrito_supreme',     name: 'Burrito Supreme (Beef)',          brand: 'Taco Bell', category: 'Restaurant', servingSize: 283, servingUnit: '1 burrito',   calories: 400, protein: 16, carbs: 51, fiber: 7, sugar: 4,  fat: 15, saturatedFat: 7,  sodium: 1080 },
  { id: 'r_tb_crunchwrap',          name: 'Crunchwrap Supreme',              brand: 'Taco Bell', category: 'Restaurant', servingSize: 305, servingUnit: '1 wrap',      calories: 540, protein: 17, carbs: 71, fiber: 7, sugar: 6,  fat: 21, saturatedFat: 7,  sodium: 1210 },
  { id: 'r_tb_chalupa',             name: 'Chalupa Supreme (Beef)',          brand: 'Taco Bell', category: 'Restaurant', servingSize: 179, servingUnit: '1 chalupa',   calories: 380, protein: 14, carbs: 38, fiber: 5, sugar: 4,  fat: 20, saturatedFat: 7,  sodium: 620  },
  { id: 'r_tb_nachos_bellgrande',   name: 'Nachos BellGrande',               brand: 'Taco Bell', category: 'Restaurant', servingSize: 382, servingUnit: '1 serving',   calories: 740, protein: 20, carbs: 79, fiber: 9, sugar: 4,  fat: 41, saturatedFat: 9,  sodium: 1180 },
  { id: 'r_tb_dlt_nacho',           name: 'Doritos Locos Taco (Nacho)',      brand: 'Taco Bell', category: 'Restaurant', servingSize: 78,  servingUnit: '1 taco',      calories: 170, protein: 8,  carbs: 13, fiber: 3, sugar: 1,  fat: 10, saturatedFat: 3.5,sodium: 340  },
  { id: 'r_tb_quesadilla_chicken',  name: 'Chicken Quesadilla',              brand: 'Taco Bell', category: 'Restaurant', servingSize: 184, servingUnit: '1 quesadilla',calories: 510, protein: 28, carbs: 40, fiber: 3, sugar: 3,  fat: 27, saturatedFat: 11, sodium: 1170 },
  { id: 'r_tb_power_bowl',          name: 'Power Menu Bowl (Chicken)',       brand: 'Taco Bell', category: 'Restaurant', servingSize: 362, servingUnit: '1 bowl',      calories: 470, protein: 26, carbs: 50, fiber: 10,sugar: 4,  fat: 18, saturatedFat: 7,  sodium: 1260 },
  { id: 'r_tb_bean_burrito',        name: 'Bean Burrito',                    brand: 'Taco Bell', category: 'Restaurant', servingSize: 198, servingUnit: '1 burrito',   calories: 350, protein: 13, carbs: 54, fiber: 9, sugar: 5,  fat: 9,  saturatedFat: 3.5,sodium: 1000 },
  { id: 'r_tb_mexican_pizza',       name: 'Mexican Pizza',                   brand: 'Taco Bell', category: 'Restaurant', servingSize: 213, servingUnit: '1 pizza',     calories: 700, protein: 22, carbs: 73, fiber: 8, sugar: 5,  fat: 38, saturatedFat: 9,  sodium: 930  },

  // ══════════════════════════════════════════════════════════════════════════
  // WENDY'S
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_wdy_daves_single',       name: "Dave's Single",                   brand: "Wendy's", category: 'Restaurant', servingSize: 247, servingUnit: '1 burger',    calories: 570, protein: 29, carbs: 40, fiber: 2, sugar: 10, fat: 34, saturatedFat: 13, sodium: 1050 },
  { id: 'r_wdy_daves_double',       name: "Dave's Double",                   brand: "Wendy's", category: 'Restaurant', servingSize: 338, servingUnit: '1 burger',    calories: 840, protein: 46, carbs: 41, fiber: 2, sugar: 10, fat: 55, saturatedFat: 24, sodium: 1400 },
  { id: 'r_wdy_baconator',          name: 'Baconator',                       brand: "Wendy's", category: 'Restaurant', servingSize: 370, servingUnit: '1 burger',    calories: 950, protein: 57, carbs: 37, fiber: 1, sugar: 9,  fat: 63, saturatedFat: 27, sodium: 1800 },
  { id: 'r_wdy_spicy_chicken',      name: 'Spicy Chicken Sandwich',          brand: "Wendy's", category: 'Restaurant', servingSize: 239, servingUnit: '1 sandwich',  calories: 500, protein: 31, carbs: 56, fiber: 3, sugar: 8,  fat: 19, saturatedFat: 3.5,sodium: 1270 },
  { id: 'r_wdy_grilled_chicken',    name: 'Grilled Chicken Sandwich',        brand: "Wendy's", category: 'Restaurant', servingSize: 213, servingUnit: '1 sandwich',  calories: 360, protein: 34, carbs: 38, fiber: 2, sugar: 8,  fat: 7,  saturatedFat: 1.5,sodium: 940  },
  { id: 'r_wdy_chili_small',        name: 'Chili (Small)',                   brand: "Wendy's", category: 'Restaurant', servingSize: 227, servingUnit: '1 small',     calories: 160, protein: 14, carbs: 20, fiber: 5, sugar: 4,  fat: 3,  saturatedFat: 1,  sodium: 700  },
  { id: 'r_wdy_baked_potato',       name: 'Baked Potato (Plain)',            brand: "Wendy's", category: 'Restaurant', servingSize: 284, servingUnit: '1 potato',    calories: 270, protein: 7,  carbs: 61, fiber: 7, sugar: 2,  fat: 0,  saturatedFat: 0,  sodium: 25   },
  { id: 'r_wdy_fries_small',        name: 'Natural-Cut Fries (Small)',       brand: "Wendy's", category: 'Restaurant', servingSize: 85,  servingUnit: '1 small',     calories: 230, protein: 3,  carbs: 30, fiber: 3, sugar: 0,  fat: 11, saturatedFat: 2,  sodium: 270  },
  { id: 'r_wdy_frosty_choc_small',  name: 'Chocolate Frosty (Small)',        brand: "Wendy's", category: 'Restaurant', servingSize: 227, servingUnit: '1 small',     calories: 340, protein: 9,  carbs: 58, fiber: 0, sugar: 50, fat: 8,  saturatedFat: 5,  sodium: 170  },

  // ══════════════════════════════════════════════════════════════════════════
  // BURGER KING
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_bk_whopper',             name: 'Whopper',                         brand: 'Burger King', category: 'Restaurant', servingSize: 291, servingUnit: '1 burger',    calories: 660, protein: 28, carbs: 49, fiber: 2, sugar: 11, fat: 40, saturatedFat: 12, sodium: 980  },
  { id: 'r_bk_whopper_jr',          name: 'Whopper Jr.',                     brand: 'Burger King', category: 'Restaurant', servingSize: 162, servingUnit: '1 burger',    calories: 310, protein: 16, carbs: 32, fiber: 1, sugar: 7,  fat: 14, saturatedFat: 4,  sodium: 560  },
  { id: 'r_bk_dbl_whopper',         name: 'Double Whopper',                  brand: 'Burger King', category: 'Restaurant', servingSize: 374, servingUnit: '1 burger',    calories: 900, protein: 46, carbs: 49, fiber: 2, sugar: 11, fat: 58, saturatedFat: 20, sodium: 1100 },
  { id: 'r_bk_crispy_chicken',      name: 'Crispy Chicken Sandwich',         brand: 'Burger King', category: 'Restaurant', servingSize: 197, servingUnit: '1 sandwich',  calories: 680, protein: 25, carbs: 71, fiber: 3, sugar: 8,  fat: 35, saturatedFat: 6,  sodium: 1120 },
  { id: 'r_bk_chicken_fries_9pc',   name: 'Chicken Fries (9 pc)',            brand: 'Burger King', category: 'Restaurant', servingSize: 113, servingUnit: '9 pieces',    calories: 280, protein: 19, carbs: 22, fiber: 0, sugar: 0,  fat: 13, saturatedFat: 3,  sodium: 510  },
  { id: 'r_bk_onion_rings_med',     name: 'Onion Rings (Medium)',            brand: 'Burger King', category: 'Restaurant', servingSize: 91,  servingUnit: '1 medium',    calories: 320, protein: 4,  carbs: 39, fiber: 3, sugar: 2,  fat: 16, saturatedFat: 3,  sodium: 550  },
  { id: 'r_bk_croissan_sausage',    name: "Sausage, Egg & Cheese Croissan'wich", brand: 'Burger King', category: 'Restaurant', servingSize: 162, servingUnit: '1 sandwich', calories: 520, protein: 22, carbs: 31, fiber: 1, sugar: 6, fat: 33, saturatedFat: 12, sodium: 1100 },
  { id: 'r_bk_french_toast',        name: 'French Toast Sticks (5 pc)',      brand: 'Burger King', category: 'Restaurant', servingSize: 128, servingUnit: '5 sticks',    calories: 390, protein: 7,  carbs: 51, fiber: 1, sugar: 19, fat: 18, saturatedFat: 4,  sodium: 590  },

  // ══════════════════════════════════════════════════════════════════════════
  // SUBWAY  (6-inch on 9-grain wheat unless noted)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_sub_turkey_6',           name: 'Turkey Breast (6-inch)',          brand: 'Subway', category: 'Restaurant', servingSize: 225, servingUnit: '6-inch sub',  calories: 280, protein: 18, carbs: 45, fiber: 4, sugar: 7,  fat: 4.5,saturatedFat: 1,  sodium: 900  },
  { id: 'r_sub_rotisserie_chk_6',   name: 'Rotisserie Chicken (6-inch)',     brand: 'Subway', category: 'Restaurant', servingSize: 240, servingUnit: '6-inch sub',  calories: 350, protein: 24, carbs: 46, fiber: 4, sugar: 8,  fat: 7,  saturatedFat: 2,  sodium: 950  },
  { id: 'r_sub_steak_cheese_6',     name: 'Steak & Cheese (6-inch)',         brand: 'Subway', category: 'Restaurant', servingSize: 250, servingUnit: '6-inch sub',  calories: 350, protein: 26, carbs: 46, fiber: 4, sugar: 7,  fat: 10, saturatedFat: 4,  sodium: 960  },
  { id: 'r_sub_italian_bmt_6',      name: 'Italian B.M.T. (6-inch)',         brand: 'Subway', category: 'Restaurant', servingSize: 232, servingUnit: '6-inch sub',  calories: 410, protein: 22, carbs: 44, fiber: 4, sugar: 7,  fat: 18, saturatedFat: 7,  sodium: 1630 },
  { id: 'r_sub_meatball_6',         name: 'Meatball Marinara (6-inch)',      brand: 'Subway', category: 'Restaurant', servingSize: 282, servingUnit: '6-inch sub',  calories: 490, protein: 24, carbs: 62, fiber: 6, sugar: 15, fat: 18, saturatedFat: 7,  sodium: 1020 },
  { id: 'r_sub_veggie_6',           name: 'Veggie Delite (6-inch)',          brand: 'Subway', category: 'Restaurant', servingSize: 190, servingUnit: '6-inch sub',  calories: 230, protein: 8,  carbs: 44, fiber: 4, sugar: 6,  fat: 2.5,saturatedFat: 0.5,sodium: 350  },
  { id: 'r_sub_tuna_6',             name: 'Tuna (6-inch)',                   brand: 'Subway', category: 'Restaurant', servingSize: 250, servingUnit: '6-inch sub',  calories: 480, protein: 20, carbs: 44, fiber: 4, sugar: 6,  fat: 24, saturatedFat: 5,  sodium: 720  },
  { id: 'r_sub_spicy_italian_6',    name: 'Spicy Italian (6-inch)',          brand: 'Subway', category: 'Restaurant', servingSize: 231, servingUnit: '6-inch sub',  calories: 510, protein: 22, carbs: 44, fiber: 4, sugar: 7,  fat: 27, saturatedFat: 10, sodium: 1700 },
  { id: 'r_sub_blackforest_ham_6',  name: 'Black Forest Ham (6-inch)',       brand: 'Subway', category: 'Restaurant', servingSize: 213, servingUnit: '6-inch sub',  calories: 310, protein: 18, carbs: 45, fiber: 4, sugar: 7,  fat: 5.5,saturatedFat: 1.5,sodium: 940  },
  { id: 'r_sub_sweet_onion_chk_6',  name: 'Sweet Onion Chicken Teriyaki (6-inch)', brand: 'Subway', category: 'Restaurant', servingSize: 280, servingUnit: '6-inch sub', calories: 370, protein: 25, carbs: 57, fiber: 4, sugar: 18, fat: 5, saturatedFat: 1, sodium: 950 },

  // ══════════════════════════════════════════════════════════════════════════
  // PANERA BREAD
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_pan_broc_cheddar_soup',  name: 'Broccoli Cheddar Soup (Bowl)',    brand: 'Panera Bread', category: 'Restaurant', servingSize: 340, servingUnit: '1 bowl',    calories: 380, protein: 15, carbs: 40, fiber: 5, sugar: 10, fat: 19, saturatedFat: 10, sodium: 1280 },
  { id: 'r_pan_fuji_apple_salad',   name: 'Fuji Apple Salad w/ Chicken',    brand: 'Panera Bread', category: 'Restaurant', servingSize: 376, servingUnit: '1 full',    calories: 560, protein: 33, carbs: 52, fiber: 6, sugar: 32, fat: 23, saturatedFat: 6,  sodium: 1010 },
  { id: 'r_pan_chipotle_melt',      name: 'Chipotle Chicken Avocado Melt',  brand: 'Panera Bread', category: 'Restaurant', servingSize: 332, servingUnit: '1 sandwich',calories: 690, protein: 42, carbs: 63, fiber: 3, sugar: 6,  fat: 28, saturatedFat: 10, sodium: 1640 },
  { id: 'r_pan_turkey_avocado',     name: 'Turkey Avocado BLT',             brand: 'Panera Bread', category: 'Restaurant', servingSize: 309, servingUnit: '1 sandwich',calories: 620, protein: 38, carbs: 56, fiber: 4, sugar: 8,  fat: 23, saturatedFat: 7,  sodium: 1770 },
  { id: 'r_pan_cinnamon_bagel',     name: 'Cinnamon Crunch Bagel',          brand: 'Panera Bread', category: 'Restaurant', servingSize: 135, servingUnit: '1 bagel',   calories: 420, protein: 10, carbs: 83, fiber: 3, sugar: 24, fat: 8,  saturatedFat: 3.5,sodium: 430  },
  { id: 'r_pan_mac_cheese',         name: 'Mac & Cheese',                   brand: 'Panera Bread', category: 'Restaurant', servingSize: 314, servingUnit: '1 bowl',    calories: 470, protein: 19, carbs: 54, fiber: 2, sugar: 8,  fat: 20, saturatedFat: 11, sodium: 1040 },
  { id: 'r_pan_chicken_soup',       name: 'Chicken Noodle Soup (Bowl)',     brand: 'Panera Bread', category: 'Restaurant', servingSize: 340, servingUnit: '1 bowl',    calories: 150, protein: 13, carbs: 17, fiber: 2, sugar: 3,  fat: 3,  saturatedFat: 0.5,sodium: 1020 },
  { id: 'r_pan_caesar_salad',       name: 'Caesar Salad w/ Grilled Chicken',brand: 'Panera Bread', category: 'Restaurant', servingSize: 330, servingUnit: '1 full',    calories: 420, protein: 40, carbs: 15, fiber: 4, sugar: 3,  fat: 22, saturatedFat: 5,  sodium: 1370 },

  // ══════════════════════════════════════════════════════════════════════════
  // STARBUCKS
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_sbx_latte_grande_whole', name: 'Caffè Latte Grande (Whole Milk)',  brand: 'Starbucks', category: 'Restaurant', servingSize: 473, servingUnit: '16 fl oz',  calories: 250, protein: 13, carbs: 22, fiber: 0, sugar: 18, fat: 12, saturatedFat: 7,  sodium: 170 },
  { id: 'r_sbx_caramel_macchiato', name: 'Caramel Macchiato (Iced, Grande)',  brand: 'Starbucks', category: 'Restaurant', servingSize: 473, servingUnit: '16 fl oz',  calories: 240, protein: 10, carbs: 34, fiber: 0, sugar: 33, fat: 7,  saturatedFat: 4,  sodium: 150 },
  { id: 'r_sbx_mocha_frapp',       name: 'Mocha Frappuccino (Grande)',        brand: 'Starbucks', category: 'Restaurant', servingSize: 473, servingUnit: '16 fl oz',  calories: 380, protein: 5,  carbs: 61, fiber: 0, sugar: 58, fat: 13, saturatedFat: 8,  sodium: 220 },
  { id: 'r_sbx_psl_grande',        name: 'Pumpkin Spice Latte Grande (2%)',   brand: 'Starbucks', category: 'Restaurant', servingSize: 473, servingUnit: '16 fl oz',  calories: 380, protein: 14, carbs: 52, fiber: 0, sugar: 50, fat: 13, saturatedFat: 8,  sodium: 240 },
  { id: 'r_sbx_egg_cheese_sndwch', name: 'Egg & Cheddar Sandwich',           brand: 'Starbucks', category: 'Restaurant', servingSize: 118, servingUnit: '1 sandwich', calories: 350, protein: 15, carbs: 44, fiber: 2, sugar: 5,  fat: 12, saturatedFat: 5,  sodium: 670 },
  { id: 'r_sbx_turkey_bacon',      name: 'Turkey, Bacon & Cheese Sandwich',  brand: 'Starbucks', category: 'Restaurant', servingSize: 170, servingUnit: '1 sandwich', calories: 440, protein: 29, carbs: 44, fiber: 2, sugar: 6,  fat: 17, saturatedFat: 7,  sodium: 1110 },
  { id: 'r_sbx_bacon_gouda',       name: 'Bacon, Gouda & Egg Sandwich',      brand: 'Starbucks', category: 'Restaurant', servingSize: 130, servingUnit: '1 sandwich', calories: 370, protein: 17, carbs: 30, fiber: 1, sugar: 3,  fat: 19, saturatedFat: 8,  sodium: 690 },
  { id: 'r_sbx_spinach_feta_wrap', name: 'Spinach, Feta & Egg White Wrap',   brand: 'Starbucks', category: 'Restaurant', servingSize: 113, servingUnit: '1 wrap',     calories: 310, protein: 20, carbs: 33, fiber: 3, sugar: 4,  fat: 10, saturatedFat: 3.5,sodium: 830 },
  { id: 'r_sbx_protein_box',       name: 'Eggs & Cheese Protein Box',        brand: 'Starbucks', category: 'Restaurant', servingSize: 251, servingUnit: '1 box',      calories: 460, protein: 25, carbs: 47, fiber: 5, sugar: 27, fat: 18, saturatedFat: 6,  sodium: 580 },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMINO'S
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_dom_ht_cheese_2sl',      name: 'Hand Tossed Cheese (2 slices, med)', brand: "Domino's", category: 'Restaurant', servingSize: 185, servingUnit: '2 slices',  calories: 400, protein: 18, carbs: 56, fiber: 3, sugar: 5,  fat: 13, saturatedFat: 6,  sodium: 1010 },
  { id: 'r_dom_ht_pepperoni_2sl',   name: 'Hand Tossed Pepperoni (2 slices, med)', brand: "Domino's", category: 'Restaurant', servingSize: 200, servingUnit: '2 slices', calories: 460, protein: 20, carbs: 56, fiber: 3, sugar: 5, fat: 18, saturatedFat: 8, sodium: 1160 },
  { id: 'r_dom_thin_pepperoni_2sl', name: 'Thin Crust Pepperoni (2 slices, med)', brand: "Domino's", category: 'Restaurant', servingSize: 167, servingUnit: '2 slices', calories: 380, protein: 16, carbs: 40, fiber: 2, sugar: 3, fat: 18, saturatedFat: 7, sodium: 980 },
  { id: 'r_dom_brooklyn_cheese_2sl',name: 'Brooklyn Style Cheese (2 slices, lg)', brand: "Domino's", category: 'Restaurant', servingSize: 250, servingUnit: '2 slices', calories: 590, protein: 26, carbs: 70, fiber: 3, sugar: 7, fat: 24, saturatedFat: 11, sodium: 1340 },
  { id: 'r_dom_pan_cheese_2sl',     name: 'Hand Pan Cheese (2 slices, med)',   brand: "Domino's", category: 'Restaurant', servingSize: 250, servingUnit: '2 slices',  calories: 580, protein: 23, carbs: 69, fiber: 3, sugar: 6,  fat: 25, saturatedFat: 10, sodium: 1180 },
  { id: 'r_dom_garlic_twists',      name: 'Garlic Bread Twists (1 piece)',     brand: "Domino's", category: 'Restaurant', servingSize: 56,  servingUnit: '1 twist',   calories: 140, protein: 4,  carbs: 22, fiber: 1, sugar: 0,  fat: 5,  saturatedFat: 1.5,sodium: 340  },
  { id: 'r_dom_boneless_wings_8pc', name: 'Boneless Chicken Wings (8 pc)',     brand: "Domino's", category: 'Restaurant', servingSize: 196, servingUnit: '8 pieces',  calories: 440, protein: 38, carbs: 26, fiber: 2, sugar: 0,  fat: 19, saturatedFat: 4,  sodium: 1080 },
  { id: 'r_dom_cinna_twists',       name: 'Cinnamon Bread Twists (2 pieces)',  brand: "Domino's", category: 'Restaurant', servingSize: 88,  servingUnit: '2 twists',  calories: 250, protein: 5,  carbs: 38, fiber: 1, sugar: 14, fat: 9,  saturatedFat: 3,  sodium: 360  },

  // ══════════════════════════════════════════════════════════════════════════
  // PIZZA HUT
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_ph_orig_pan_pepperoni',  name: 'Original Pan Pepperoni (1 slice, med)', brand: 'Pizza Hut', category: 'Restaurant', servingSize: 115, servingUnit: '1 slice', calories: 300, protein: 13, carbs: 31, fiber: 2, sugar: 3, fat: 13, saturatedFat: 5, sodium: 710 },
  { id: 'r_ph_orig_pan_cheese',     name: 'Original Pan Cheese (1 slice, med)',    brand: 'Pizza Hut', category: 'Restaurant', servingSize: 107, servingUnit: '1 slice', calories: 250, protein: 12, carbs: 30, fiber: 2, sugar: 3, fat: 10, saturatedFat: 4, sodium: 580 },
  { id: 'r_ph_thin_pepperoni',      name: 'Thin N Crispy Pepperoni (1 slice, med)',brand: 'Pizza Hut', category: 'Restaurant', servingSize: 87,  servingUnit: '1 slice', calories: 190, protein: 9,  carbs: 19, fiber: 1, sugar: 2, fat: 9,  saturatedFat: 4, sodium: 500 },
  { id: 'r_ph_stuffed_pepperoni',   name: 'Stuffed Crust Pepperoni (1 slice, med)',brand: 'Pizza Hut', category: 'Restaurant', servingSize: 153, servingUnit: '1 slice', calories: 360, protein: 16, carbs: 37, fiber: 2, sugar: 3, fat: 17, saturatedFat: 8, sodium: 820 },
  { id: 'r_ph_breadsticks_2pc',     name: 'Breadsticks (2 pieces)',               brand: 'Pizza Hut', category: 'Restaurant', servingSize: 98,  servingUnit: '2 sticks', calories: 360, protein: 10, carbs: 51, fiber: 2, sugar: 2, fat: 13, saturatedFat: 4, sodium: 780 },
  { id: 'r_ph_traditional_wings',   name: 'Traditional Wings (2 pc)',             brand: 'Pizza Hut', category: 'Restaurant', servingSize: 78,  servingUnit: '2 wings',  calories: 130, protein: 16, carbs: 0,  fiber: 0, sugar: 0, fat: 7,  saturatedFat: 2, sodium: 530 },

  // ══════════════════════════════════════════════════════════════════════════
  // PANDA EXPRESS
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_pex_orange_chicken',     name: 'Orange Chicken',                  brand: 'Panda Express', category: 'Restaurant', servingSize: 162, servingUnit: '1 serving', calories: 490, protein: 27, carbs: 43, fiber: 1, sugar: 19, fat: 23, saturatedFat: 4.5,sodium: 820  },
  { id: 'r_pex_broccoli_beef',      name: 'Broccoli Beef',                   brand: 'Panda Express', category: 'Restaurant', servingSize: 154, servingUnit: '1 serving', calories: 150, protein: 9,  carbs: 13, fiber: 2, sugar: 5,  fat: 7,  saturatedFat: 1.5,sodium: 530  },
  { id: 'r_pex_kung_pao_chicken',   name: 'Kung Pao Chicken',                brand: 'Panda Express', category: 'Restaurant', servingSize: 162, servingUnit: '1 serving', calories: 290, protein: 22, carbs: 20, fiber: 3, sugar: 5,  fat: 14, saturatedFat: 2.5,sodium: 870  },
  { id: 'r_pex_grilled_teriyaki',   name: 'Grilled Teriyaki Chicken',        brand: 'Panda Express', category: 'Restaurant', servingSize: 156, servingUnit: '1 serving', calories: 300, protein: 36, carbs: 8,  fiber: 0, sugar: 8,  fat: 13, saturatedFat: 3,  sodium: 530  },
  { id: 'r_pex_string_bean_chk',    name: 'String Bean Chicken Breast',      brand: 'Panda Express', category: 'Restaurant', servingSize: 162, servingUnit: '1 serving', calories: 210, protein: 21, carbs: 12, fiber: 3, sugar: 5,  fat: 8,  saturatedFat: 1.5,sodium: 860  },
  { id: 'r_pex_black_pepper_chk',   name: 'Black Pepper Chicken',            brand: 'Panda Express', category: 'Restaurant', servingSize: 142, servingUnit: '1 serving', calories: 250, protein: 18, carbs: 12, fiber: 2, sugar: 4,  fat: 14, saturatedFat: 3,  sodium: 1050 },
  { id: 'r_pex_beijing_beef',       name: 'Beijing Beef',                    brand: 'Panda Express', category: 'Restaurant', servingSize: 156, servingUnit: '1 serving', calories: 470, protein: 13, carbs: 52, fiber: 3, sugar: 25, fat: 24, saturatedFat: 5,  sodium: 640  },
  { id: 'r_pex_chow_mein',          name: 'Chow Mein',                       brand: 'Panda Express', category: 'Restaurant', servingSize: 266, servingUnit: '1 serving', calories: 510, protein: 16, carbs: 87, fiber: 4, sugar: 6,  fat: 12, saturatedFat: 2,  sodium: 850  },
  { id: 'r_pex_fried_rice',         name: 'Fried Rice',                      brand: 'Panda Express', category: 'Restaurant', servingSize: 264, servingUnit: '1 serving', calories: 620, protein: 18, carbs: 98, fiber: 2, sugar: 6,  fat: 18, saturatedFat: 3.5,sodium: 1050 },
  { id: 'r_pex_white_rice',         name: 'Steamed White Rice',              brand: 'Panda Express', category: 'Restaurant', servingSize: 231, servingUnit: '1 serving', calories: 380, protein: 7,  carbs: 86, fiber: 0, sugar: 0,  fat: 0,  saturatedFat: 0,  sodium: 0    },
  { id: 'r_pex_honey_walnut_shrimp',name: 'Honey Walnut Shrimp',             brand: 'Panda Express', category: 'Restaurant', servingSize: 102, servingUnit: '1 serving', calories: 360, protein: 14, carbs: 35, fiber: 1, sugar: 17, fat: 20, saturatedFat: 3.5,sodium: 440  },

  // ══════════════════════════════════════════════════════════════════════════
  // OLIVE GARDEN
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_og_chicken_alfredo',     name: 'Chicken Alfredo (Entrée)',        brand: 'Olive Garden', category: 'Restaurant', servingSize: 570, servingUnit: '1 plate',   calories: 1330,protein: 75, carbs: 104,fiber: 6, sugar: 9,  fat: 68, saturatedFat: 40, sodium: 2220 },
  { id: 'r_og_spaghetti_meat_sauce',name: 'Spaghetti & Meat Sauce',         brand: 'Olive Garden', category: 'Restaurant', servingSize: 540, servingUnit: '1 plate',   calories: 890, protein: 42, carbs: 124,fiber: 8, sugar: 14, fat: 24, saturatedFat: 9,  sodium: 1480 },
  { id: 'r_og_fettuccine_alfredo',  name: 'Fettuccine Alfredo (Entrée)',     brand: 'Olive Garden', category: 'Restaurant', servingSize: 490, servingUnit: '1 plate',   calories: 1220,protein: 36, carbs: 104,fiber: 5, sugar: 7,  fat: 75, saturatedFat: 46, sodium: 1350 },
  { id: 'r_og_chicken_parm',        name: 'Chicken Parmigiana',              brand: 'Olive Garden', category: 'Restaurant', servingSize: 490, servingUnit: '1 plate',   calories: 1060,protein: 75, carbs: 87, fiber: 7, sugar: 14, fat: 46, saturatedFat: 21, sodium: 2750 },
  { id: 'r_og_house_salad',         name: 'Signature House Salad (1 order)',  brand: 'Olive Garden', category: 'Restaurant', servingSize: 286, servingUnit: '1 salad',  calories: 150, protein: 2,  carbs: 12, fiber: 2, sugar: 5,  fat: 10, saturatedFat: 1.5,sodium: 1390 },
  { id: 'r_og_breadstick',          name: 'Breadstick (1 plain)',            brand: 'Olive Garden', category: 'Restaurant', servingSize: 47,  servingUnit: '1 stick',   calories: 140, protein: 5,  carbs: 25, fiber: 1, sugar: 2,  fat: 3,  saturatedFat: 0.5,sodium: 460  },
  { id: 'r_og_minestrone_soup',     name: 'Minestrone Soup (Cup)',           brand: 'Olive Garden', category: 'Restaurant', servingSize: 227, servingUnit: '1 cup',     calories: 120, protein: 5,  carbs: 20, fiber: 5, sugar: 5,  fat: 2.5,saturatedFat: 0,  sodium: 1000 },
  { id: 'r_og_chicken_gnocchi',     name: 'Chicken & Gnocchi Soup (Cup)',   brand: 'Olive Garden', category: 'Restaurant', servingSize: 227, servingUnit: '1 cup',     calories: 250, protein: 14, carbs: 25, fiber: 2, sugar: 3,  fat: 11, saturatedFat: 5,  sodium: 1170 },

  // ══════════════════════════════════════════════════════════════════════════
  // IHOP
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_ihop_buttermilk_2pc',    name: 'Original Buttermilk Pancakes (2)',brand: 'IHOP', category: 'Restaurant', servingSize: 241, servingUnit: '2 pancakes', calories: 430, protein: 10, carbs: 76, fiber: 2, sugar: 20, fat: 11, saturatedFat: 5,  sodium: 830  },
  { id: 'r_ihop_belgian_waffle',    name: 'Belgian Waffle',                  brand: 'IHOP', category: 'Restaurant', servingSize: 195, servingUnit: '1 waffle',   calories: 550, protein: 11, carbs: 62, fiber: 2, sugar: 12, fat: 29, saturatedFat: 14, sodium: 730  },
  { id: 'r_ihop_stuffed_french',    name: 'Stuffed French Toast',            brand: 'IHOP', category: 'Restaurant', servingSize: 397, servingUnit: '1 serving',  calories: 1030,protein: 23, carbs: 121,fiber: 3, sugar: 73, fat: 52, saturatedFat: 20, sodium: 1100 },
  { id: 'r_ihop_spinach_mushroom',  name: 'Spinach & Mushroom Omelette',     brand: 'IHOP', category: 'Restaurant', servingSize: 326, servingUnit: '1 omelette', calories: 570, protein: 37, carbs: 14, fiber: 3, sugar: 6,  fat: 40, saturatedFat: 18, sodium: 1080 },
  { id: 'r_ihop_big_breakfast',     name: 'Big Steak Omelette',              brand: 'IHOP', category: 'Restaurant', servingSize: 400, servingUnit: '1 omelette', calories: 790, protein: 52, carbs: 13, fiber: 2, sugar: 4,  fat: 61, saturatedFat: 27, sodium: 1760 },

  // ══════════════════════════════════════════════════════════════════════════
  // DENNY'S
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_den_grand_slam',         name: 'Grand Slam',                      brand: "Denny's", category: 'Restaurant', servingSize: 386, servingUnit: '1 plate',   calories: 660, protein: 35, carbs: 59, fiber: 2, sugar: 11, fat: 33, saturatedFat: 11, sodium: 2510 },
  { id: 'r_den_original_slam',      name: 'Original Slam',                   brand: "Denny's", category: 'Restaurant', servingSize: 260, servingUnit: '1 plate',   calories: 490, protein: 28, carbs: 29, fiber: 1, sugar: 5,  fat: 29, saturatedFat: 9,  sodium: 1840 },
  { id: 'r_den_classic_burger',     name: 'Classic Burger',                  brand: "Denny's", category: 'Restaurant', servingSize: 340, servingUnit: '1 burger',  calories: 750, protein: 44, carbs: 49, fiber: 2, sugar: 9,  fat: 41, saturatedFat: 16, sodium: 1500 },
  { id: 'r_den_superbird',          name: 'Super Bird Sandwich',              brand: "Denny's", category: 'Restaurant', servingSize: 280, servingUnit: '1 sandwich',calories: 590, protein: 47, carbs: 42, fiber: 2, sugar: 7,  fat: 26, saturatedFat: 10, sodium: 1790 },
  { id: 'r_den_fit_veggie_skillet', name: 'Fit Fare Veggie Skillet',         brand: "Denny's", category: 'Restaurant', servingSize: 340, servingUnit: '1 plate',   calories: 430, protein: 19, carbs: 36, fiber: 9, sugar: 8,  fat: 24, saturatedFat: 9,  sodium: 1810 },
  { id: 'r_den_lumberjack_slam',    name: 'Lumberjack Slam',                 brand: "Denny's", category: 'Restaurant', servingSize: 552, servingUnit: '1 plate',   calories: 1140,protein: 60, carbs: 96, fiber: 5, sugar: 26, fat: 57, saturatedFat: 20, sodium: 3300 },

  // ══════════════════════════════════════════════════════════════════════════
  // SONIC DRIVE-IN
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_son_classic_burger',     name: 'Classic Burger',                  brand: 'Sonic', category: 'Restaurant', servingSize: 214, servingUnit: '1 burger',   calories: 570, protein: 30, carbs: 42, fiber: 2, sugar: 8,  fat: 32, saturatedFat: 11, sodium: 1040 },
  { id: 'r_son_cheeseburger',       name: 'Sonic Cheeseburger',              brand: 'Sonic', category: 'Restaurant', servingSize: 228, servingUnit: '1 burger',   calories: 570, protein: 27, carbs: 43, fiber: 2, sugar: 9,  fat: 30, saturatedFat: 11, sodium: 990  },
  { id: 'r_son_footlong_coney',     name: 'Footlong Chili Cheese Coney',     brand: 'Sonic', category: 'Restaurant', servingSize: 310, servingUnit: '1 hot dog',  calories: 690, protein: 29, carbs: 48, fiber: 3, sugar: 10, fat: 43, saturatedFat: 17, sodium: 1890 },
  { id: 'r_son_tater_tots_med',     name: 'Tater Tots (Medium)',             brand: 'Sonic', category: 'Restaurant', servingSize: 139, servingUnit: '1 medium',   calories: 360, protein: 4,  carbs: 40, fiber: 4, sugar: 0,  fat: 21, saturatedFat: 3.5,sodium: 430  },
  { id: 'r_son_onion_rings_med',    name: 'Onion Rings (Medium)',            brand: 'Sonic', category: 'Restaurant', servingSize: 92,  servingUnit: '1 medium',   calories: 290, protein: 4,  carbs: 36, fiber: 2, sugar: 2,  fat: 15, saturatedFat: 2.5,sodium: 550  },
  { id: 'r_son_cherry_limeade',     name: 'Cherry Limeade (Large)',          brand: 'Sonic', category: 'Restaurant', servingSize: 497, servingUnit: '1 large',    calories: 340, protein: 0,  carbs: 86, fiber: 0, sugar: 84, fat: 0,  saturatedFat: 0,  sodium: 45   },

  // ══════════════════════════════════════════════════════════════════════════
  // JACK IN THE BOX
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_jib_jumbo_jack',         name: 'Jumbo Jack',                      brand: 'Jack in the Box', category: 'Restaurant', servingSize: 254, servingUnit: '1 burger',   calories: 600, protein: 26, carbs: 52, fiber: 2, sugar: 11, fat: 35, saturatedFat: 11, sodium: 930  },
  { id: 'r_jib_ultimate_cheeseburger',name: 'Ultimate Cheeseburger',        brand: 'Jack in the Box', category: 'Restaurant', servingSize: 311, servingUnit: '1 burger',   calories: 820, protein: 40, carbs: 52, fiber: 2, sugar: 10, fat: 54, saturatedFat: 20, sodium: 1170 },
  { id: 'r_jib_sourdough_jack',     name: 'Sourdough Jack',                  brand: 'Jack in the Box', category: 'Restaurant', servingSize: 273, servingUnit: '1 burger',   calories: 700, protein: 30, carbs: 46, fiber: 2, sugar: 9,  fat: 44, saturatedFat: 16, sodium: 1240 },
  { id: 'r_jib_spicy_chicken',      name: 'Spicy Crispy Chicken Sandwich',   brand: 'Jack in the Box', category: 'Restaurant', servingSize: 181, servingUnit: '1 sandwich', calories: 380, protein: 16, carbs: 37, fiber: 2, sugar: 5,  fat: 18, saturatedFat: 3,  sodium: 760  },
  { id: 'r_jib_tacos_2pc',          name: 'Tacos (2 pc)',                    brand: 'Jack in the Box', category: 'Restaurant', servingSize: 170, servingUnit: '2 tacos',    calories: 340, protein: 14, carbs: 36, fiber: 6, sugar: 2,  fat: 16, saturatedFat: 5,  sodium: 680  },
  { id: 'r_jib_curly_fries_med',    name: 'Curly Fries (Medium)',            brand: 'Jack in the Box', category: 'Restaurant', servingSize: 164, servingUnit: '1 medium',   calories: 460, protein: 6,  carbs: 59, fiber: 5, sugar: 1,  fat: 22, saturatedFat: 4,  sodium: 1070 },
  { id: 'r_jib_breakfast_jack',     name: 'Breakfast Jack',                  brand: 'Jack in the Box', category: 'Restaurant', servingSize: 128, servingUnit: '1 sandwich', calories: 300, protein: 17, carbs: 31, fiber: 1, sugar: 5,  fat: 12, saturatedFat: 4.5,sodium: 820  },
  { id: 'r_jib_chicken_strips_4pc', name: 'Chicken Strips (4 pc)',           brand: 'Jack in the Box', category: 'Restaurant', servingSize: 155, servingUnit: '4 strips',   calories: 330, protein: 24, carbs: 20, fiber: 1, sugar: 1,  fat: 18, saturatedFat: 3.5,sodium: 830  },

  // ══════════════════════════════════════════════════════════════════════════
  // DUNKIN'
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_ddk_glazed_donut',       name: 'Original Glazed Donut',           brand: "Dunkin'", category: 'Restaurant', servingSize: 57,  servingUnit: '1 donut',    calories: 250, protein: 4,  carbs: 29, fiber: 1, sugar: 12, fat: 14, saturatedFat: 6,  sodium: 270  },
  { id: 'r_ddk_boston_kreme',       name: 'Boston Kreme Donut',              brand: "Dunkin'", category: 'Restaurant', servingSize: 79,  servingUnit: '1 donut',    calories: 300, protein: 4,  carbs: 43, fiber: 1, sugar: 21, fat: 14, saturatedFat: 6,  sodium: 280  },
  { id: 'r_ddk_bacon_egg_cheese_eng',name: 'Bacon, Egg & Cheese on English Muffin', brand: "Dunkin'", category: 'Restaurant', servingSize: 169, servingUnit: '1 sandwich', calories: 370, protein: 18, carbs: 36, fiber: 2, sugar: 4, fat: 16, saturatedFat: 6, sodium: 850 },
  { id: 'r_ddk_sausage_egg_bagel',  name: 'Sausage, Egg & Cheese on Bagel', brand: "Dunkin'", category: 'Restaurant', servingSize: 262, servingUnit: '1 sandwich', calories: 680, protein: 28, carbs: 67, fiber: 3, sugar: 8,  fat: 34, saturatedFat: 12, sodium: 1290 },
  { id: 'r_ddk_hash_browns',        name: 'Hash Browns',                     brand: "Dunkin'", category: 'Restaurant', servingSize: 60,  servingUnit: '1 serving',  calories: 180, protein: 2,  carbs: 20, fiber: 2, sugar: 0,  fat: 10, saturatedFat: 1.5,sodium: 490  },
  { id: 'r_ddk_wake_up_wrap_bacon', name: 'Wake-Up Wrap (Bacon)',            brand: "Dunkin'", category: 'Restaurant', servingSize: 91,  servingUnit: '1 wrap',     calories: 190, protein: 9,  carbs: 17, fiber: 1, sugar: 1,  fat: 9,  saturatedFat: 3.5,sodium: 530  },
  { id: 'r_ddk_munchkins_glazed',   name: 'Glazed Munchkins (5 pc)',         brand: "Dunkin'", category: 'Restaurant', servingSize: 70,  servingUnit: '5 munchkins',calories: 240, protein: 3,  carbs: 36, fiber: 0, sugar: 19, fat: 10, saturatedFat: 4,  sodium: 240  },
  { id: 'r_ddk_plain_bagel_cc',     name: 'Plain Bagel with Cream Cheese',  brand: "Dunkin'", category: 'Restaurant', servingSize: 152, servingUnit: '1 bagel+CC', calories: 490, protein: 16, carbs: 76, fiber: 3, sugar: 8,  fat: 14, saturatedFat: 7,  sodium: 890  },

  // ══════════════════════════════════════════════════════════════════════════
  // POPEYES
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_pop_chicken_sndwch',     name: 'Chicken Sandwich (Classic)',      brand: 'Popeyes', category: 'Restaurant', servingSize: 236, servingUnit: '1 sandwich', calories: 700, protein: 28, carbs: 50, fiber: 3, sugar: 7,  fat: 42, saturatedFat: 8,  sodium: 1440 },
  { id: 'r_pop_spicy_sndwch',       name: 'Spicy Chicken Sandwich',         brand: 'Popeyes', category: 'Restaurant', servingSize: 236, servingUnit: '1 sandwich', calories: 700, protein: 28, carbs: 51, fiber: 3, sugar: 6,  fat: 42, saturatedFat: 8,  sodium: 1320 },
  { id: 'r_pop_2pc_chicken',        name: '2-Piece Chicken (Leg + Thigh)',   brand: 'Popeyes', category: 'Restaurant', servingSize: 243, servingUnit: '2 pieces',  calories: 670, protein: 42, carbs: 30, fiber: 1, sugar: 0,  fat: 41, saturatedFat: 10, sodium: 1360 },
  { id: 'r_pop_tenders_3pc',        name: 'Handcrafted Tenders (3 pc)',      brand: 'Popeyes', category: 'Restaurant', servingSize: 155, servingUnit: '3 tenders', calories: 430, protein: 35, carbs: 27, fiber: 1, sugar: 1,  fat: 19, saturatedFat: 4,  sodium: 940  },
  { id: 'r_pop_red_beans_rice',     name: 'Red Beans & Rice (Regular)',      brand: 'Popeyes', category: 'Restaurant', servingSize: 177, servingUnit: '1 regular', calories: 230, protein: 8,  carbs: 32, fiber: 4, sugar: 2,  fat: 9,  saturatedFat: 3,  sodium: 940  },
  { id: 'r_pop_biscuit',            name: 'Buttermilk Biscuit',              brand: 'Popeyes', category: 'Restaurant', servingSize: 64,  servingUnit: '1 biscuit', calories: 260, protein: 4,  carbs: 26, fiber: 1, sugar: 2,  fat: 16, saturatedFat: 5,  sodium: 560  },
  { id: 'r_pop_cajun_fries_lg',     name: 'Cajun Fries (Large)',             brand: 'Popeyes', category: 'Restaurant', servingSize: 243, servingUnit: '1 large',   calories: 700, protein: 10, carbs: 87, fiber: 7, sugar: 3,  fat: 35, saturatedFat: 6,  sodium: 1070 },
  { id: 'r_pop_mashed_potatoes',    name: 'Mashed Potatoes with Gravy (Reg)',brand: 'Popeyes', category: 'Restaurant', servingSize: 155, servingUnit: '1 regular', calories: 110, protein: 2,  carbs: 16, fiber: 1, sugar: 0,  fat: 4,  saturatedFat: 1.5,sodium: 440  },
  { id: 'r_pop_mac_cheese',         name: 'Mac & Cheese (Regular)',          brand: 'Popeyes', category: 'Restaurant', servingSize: 142, servingUnit: '1 regular', calories: 220, protein: 7,  carbs: 25, fiber: 1, sugar: 4,  fat: 10, saturatedFat: 5,  sodium: 560  },

  // ══════════════════════════════════════════════════════════════════════════
  // FIVE GUYS
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_5g_hamburger',           name: 'Hamburger',                       brand: 'Five Guys', category: 'Restaurant', servingSize: 291, servingUnit: '1 burger',   calories: 700, protein: 39, carbs: 39, fiber: 2, sugar: 9,  fat: 43, saturatedFat: 17, sodium: 430  },
  { id: 'r_5g_cheeseburger',        name: 'Cheeseburger',                    brand: 'Five Guys', category: 'Restaurant', servingSize: 319, servingUnit: '1 burger',   calories: 840, protein: 48, carbs: 40, fiber: 2, sugar: 9,  fat: 55, saturatedFat: 24, sodium: 690  },
  { id: 'r_5g_bacon_cheeseburger',  name: 'Bacon Cheeseburger',              brand: 'Five Guys', category: 'Restaurant', servingSize: 340, servingUnit: '1 burger',   calories: 920, protein: 51, carbs: 40, fiber: 2, sugar: 9,  fat: 62, saturatedFat: 26, sodium: 960  },
  { id: 'r_5g_little_burger',       name: 'Little Hamburger',                brand: 'Five Guys', category: 'Restaurant', servingSize: 185, servingUnit: '1 burger',   calories: 480, protein: 26, carbs: 39, fiber: 2, sugar: 9,  fat: 26, saturatedFat: 9,  sodium: 380  },
  { id: 'r_5g_fries_regular',       name: 'Fries (Regular)',                 brand: 'Five Guys', category: 'Restaurant', servingSize: 411, servingUnit: '1 regular',  calories: 953, protein: 14, carbs: 131,fiber: 12,sugar: 1,  fat: 41, saturatedFat: 7,  sodium: 312  },
  { id: 'r_5g_fries_little',        name: 'Fries (Little)',                  brand: 'Five Guys', category: 'Restaurant', servingSize: 227, servingUnit: '1 little',   calories: 526, protein: 8,  carbs: 72, fiber: 7, sugar: 1,  fat: 23, saturatedFat: 4,  sodium: 172  },
  { id: 'r_5g_hot_dog',             name: 'Hot Dog',                         brand: 'Five Guys', category: 'Restaurant', servingSize: 199, servingUnit: '1 hot dog',  calories: 460, protein: 18, carbs: 40, fiber: 1, sugar: 7,  fat: 24, saturatedFat: 8,  sodium: 890  },
  { id: 'r_5g_veggie_sandwich',     name: 'Veggie Sandwich',                 brand: 'Five Guys', category: 'Restaurant', servingSize: 295, servingUnit: '1 sandwich', calories: 440, protein: 17, carbs: 60, fiber: 5, sugar: 15, fat: 15, saturatedFat: 4,  sodium: 1040 },

  // ══════════════════════════════════════════════════════════════════════════
  // WINGSTOP
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_ws_classic_wings_6pc',   name: 'Classic Wings (6 pc, plain)',     brand: 'Wingstop', category: 'Restaurant', servingSize: 168, servingUnit: '6 wings',   calories: 590, protein: 36, carbs: 3,  fiber: 0, sugar: 1,  fat: 42, saturatedFat: 12, sodium: 1550 },
  { id: 'r_ws_boneless_wings_6pc',  name: 'Boneless Wings (6 pc)',           brand: 'Wingstop', category: 'Restaurant', servingSize: 170, servingUnit: '6 pieces',  calories: 440, protein: 40, carbs: 42, fiber: 2, sugar: 1,  fat: 13, saturatedFat: 3,  sodium: 1530 },
  { id: 'r_ws_seasoned_fries_reg',  name: 'Seasoned Fries (Regular)',        brand: 'Wingstop', category: 'Restaurant', servingSize: 148, servingUnit: '1 regular', calories: 480, protein: 7,  carbs: 66, fiber: 6, sugar: 1,  fat: 21, saturatedFat: 4,  sodium: 820  },
  { id: 'r_ws_corn',                name: 'Corn on the Cob',                 brand: 'Wingstop', category: 'Restaurant', servingSize: 76,  servingUnit: '1 ear',     calories: 70,  protein: 3,  carbs: 13, fiber: 2, sugar: 5,  fat: 2,  saturatedFat: 0,  sodium: 10   },
  { id: 'r_ws_ranch_dip',           name: 'Ranch Dipping Sauce',             brand: 'Wingstop', category: 'Restaurant', servingSize: 42,  servingUnit: '1 container',calories: 220, protein: 1,  carbs: 1,  fiber: 0, sugar: 1,  fat: 24, saturatedFat: 4,  sodium: 380  },
  { id: 'r_ws_voodoo_wings_6pc',    name: 'Louisiana Voodoo Wings (6 pc)',   brand: 'Wingstop', category: 'Restaurant', servingSize: 185, servingUnit: '6 wings',   calories: 620, protein: 36, carbs: 9,  fiber: 1, sugar: 4,  fat: 46, saturatedFat: 13, sodium: 1980 },

  // ══════════════════════════════════════════════════════════════════════════
  // JERSEY MIKE'S  (regular sub)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_jm_turkey_provolone',    name: '#2 Jersey Shore Favorite (Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 272, servingUnit: '1 regular sub', calories: 520, protein: 33, carbs: 57, fiber: 3, sugar: 8, fat: 17, saturatedFat: 7, sodium: 1580 },
  { id: 'r_jm_club_sub',            name: '#8 Club Supreme (Regular)',          brand: "Jersey Mike's", category: 'Restaurant', servingSize: 322, servingUnit: '1 regular sub', calories: 660, protein: 39, carbs: 57, fiber: 3, sugar: 8, fat: 27, saturatedFat: 10, sodium: 2200 },
  { id: 'r_jm_italian',             name: '#13 Original Italian (Regular)',     brand: "Jersey Mike's", category: 'Restaurant', servingSize: 330, servingUnit: '1 regular sub', calories: 890, protein: 37, carbs: 61, fiber: 3, sugar: 8, fat: 54, saturatedFat: 20, sodium: 2420 },
  { id: 'r_jm_chicken_philly',      name: 'Chicken Philly (Regular)',           brand: "Jersey Mike's", category: 'Restaurant', servingSize: 305, servingUnit: '1 regular sub', calories: 620, protein: 41, carbs: 61, fiber: 3, sugar: 10, fat: 23, saturatedFat: 9, sodium: 1350 },
  { id: 'r_jm_blt',                 name: 'BLT (Regular)',                      brand: "Jersey Mike's", category: 'Restaurant', servingSize: 255, servingUnit: '1 regular sub', calories: 680, protein: 26, carbs: 58, fiber: 3, sugar: 8, fat: 39, saturatedFat: 12, sodium: 1760 },
  { id: 'r_jm_roast_beef',          name: '#9 Club Supreme (Roast Beef, Regular)', brand: "Jersey Mike's", category: 'Restaurant', servingSize: 286, servingUnit: '1 regular sub', calories: 560, protein: 36, carbs: 57, fiber: 3, sugar: 8, fat: 20, saturatedFat: 8, sodium: 1590 },
  { id: 'r_jm_tuna',                name: '#7 Tuna Fish (Regular)',              brand: "Jersey Mike's", category: 'Restaurant', servingSize: 270, servingUnit: '1 regular sub', calories: 730, protein: 29, carbs: 60, fiber: 3, sugar: 8, fat: 43, saturatedFat: 7, sodium: 1310 },

  // ══════════════════════════════════════════════════════════════════════════
  // SHAKE SHACK
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'r_ss_shackburger',         name: 'ShackBurger',                     brand: 'Shake Shack', category: 'Restaurant', servingSize: 180, servingUnit: '1 burger',   calories: 480, protein: 25, carbs: 35, fiber: 1, sugar: 11, fat: 27, saturatedFat: 11, sodium: 740  },
  { id: 'r_ss_smokeshack',          name: 'SmokeShack',                      brand: 'Shake Shack', category: 'Restaurant', servingSize: 210, servingUnit: '1 burger',   calories: 580, protein: 30, carbs: 35, fiber: 1, sugar: 11, fat: 35, saturatedFat: 14, sodium: 1120 },
  { id: 'r_ss_double_shackburger',  name: 'Double ShackBurger',              brand: 'Shake Shack', category: 'Restaurant', servingSize: 267, servingUnit: '1 burger',   calories: 760, protein: 46, carbs: 36, fiber: 1, sugar: 11, fat: 49, saturatedFat: 21, sodium: 1060 },
  { id: 'r_ss_chickn_shack',        name: "Chick'n Shack",                   brand: 'Shake Shack', category: 'Restaurant', servingSize: 246, servingUnit: '1 sandwich', calories: 640, protein: 28, carbs: 63, fiber: 3, sugar: 9,  fat: 33, saturatedFat: 8,  sodium: 1480 },
  { id: 'r_ss_grilled_chickn',      name: "Grilled Chick'n",                 brand: 'Shake Shack', category: 'Restaurant', servingSize: 207, servingUnit: '1 sandwich', calories: 410, protein: 38, carbs: 37, fiber: 2, sugar: 8,  fat: 13, saturatedFat: 4,  sodium: 1290 },
  { id: 'r_ss_fries_regular',       name: 'Fries (Regular)',                 brand: 'Shake Shack', category: 'Restaurant', servingSize: 163, servingUnit: '1 regular',  calories: 390, protein: 6,  carbs: 51, fiber: 3, sugar: 1,  fat: 18, saturatedFat: 3,  sodium: 500  },
  { id: 'r_ss_chocolate_shake',     name: 'Chocolate Shake (16 oz)',         brand: 'Shake Shack', category: 'Restaurant', servingSize: 454, servingUnit: '16 fl oz',   calories: 780, protein: 19, carbs: 111,fiber: 1, sugar: 94, fat: 33, saturatedFat: 21, sodium: 390  },
  { id: 'r_ss_cheese_dog',          name: 'Cheese Dog',                      brand: 'Shake Shack', category: 'Restaurant', servingSize: 172, servingUnit: '1 hot dog',  calories: 430, protein: 19, carbs: 25, fiber: 1, sugar: 3,  fat: 27, saturatedFat: 12, sodium: 820  },
]
