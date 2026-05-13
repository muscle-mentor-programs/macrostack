// ─── Protein Bars — Batch 2 ──────────────────────────────────────────────────
// Brands: Clif Builder's · KIND Protein · Perfect Bar · GoMacro · No Cow
//         Grenade Carb Killa · thinkThin · ALOHA · Vega · Munk Pack
//         Detour · Power Crunch · Atlas · Rise · IQ Bar · Combat Crunch

export const FOODS_BARS2 = [

  // ══ CLIF BUILDER'S ══════════════════════════════════════════════════════════
  // 20g plant protein bars, 68g each. Source: clifbar.com / fatsecret.com
  { id: 'clif_builders_choc', name: 'Chocolate Protein Bar', brand: "Clif Builder's", category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 270, protein: 20, carbs: 29, fiber: 2, sugar: 21, fat: 9, saturatedFat: 6, sodium: 200 },
  { id: 'clif_builders_choc_mint', name: 'Chocolate Mint Protein Bar', brand: "Clif Builder's", category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 270, protein: 20, carbs: 30, fiber: 2, sugar: 21, fat: 9, saturatedFat: 6, sodium: 200 },
  { id: 'clif_builders_choc_pb', name: 'Chocolate Peanut Butter Protein Bar', brand: "Clif Builder's", category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 290, protein: 20, carbs: 29, fiber: 2, sugar: 17, fat: 11, saturatedFat: 6, sodium: 330 },
  { id: 'clif_builders_crunchy_pb', name: 'Crunchy Peanut Butter Protein Bar', brand: "Clif Builder's", category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 300, protein: 20, carbs: 29, fiber: 2, sugar: 16, fat: 11, saturatedFat: 6, sodium: 330 },
  { id: 'clif_builders_vanilla_almond', name: 'Vanilla Almond Protein Bar', brand: "Clif Builder's", category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 270, protein: 20, carbs: 30, fiber: 2, sugar: 22, fat: 8, saturatedFat: 5, sodium: 240 },

  // ══ KIND PROTEIN ════════════════════════════════════════════════════════════
  // 12g protein bars, 50g each. Source: kindsnacks.com / fatsecret.com
  { id: 'kind_protein_dark_choc_nut', name: 'Dark Chocolate Nut Protein Bar', brand: 'KIND Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 240, protein: 12, carbs: 18, fiber: 5, sugar: 8, fat: 17, saturatedFat: 4, sodium: 125 },
  { id: 'kind_protein_crunchy_pb', name: 'Crunchy Peanut Butter Protein Bar', brand: 'KIND Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 250, protein: 12, carbs: 17, fiber: 6, sugar: 7, fat: 18, saturatedFat: 4, sodium: 135 },
  { id: 'kind_protein_toasted_caramel', name: 'Toasted Caramel Nut Protein Bar', brand: 'KIND Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 250, protein: 12, carbs: 18, fiber: 5, sugar: 8, fat: 17, saturatedFat: 4, sodium: 75 },
  { id: 'kind_protein_double_dark_choc', name: 'Double Dark Chocolate Nut Protein Bar', brand: 'KIND Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 240, protein: 12, carbs: 18, fiber: 5, sugar: 8, fat: 13, saturatedFat: 4, sodium: 125 },
  { id: 'kind_protein_dark_choc_cherry', name: 'Dark Chocolate Cherry Cashew Protein Bar', brand: 'KIND Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 240, protein: 12, carbs: 19, fiber: 4, sugar: 9, fat: 15, saturatedFat: 4, sodium: 100 },

  // ══ PERFECT BAR ═════════════════════════════════════════════════════════════
  // Refrigerated whole food protein bars. Source: perfectsnacks.com
  { id: 'perfect_bar_dark_choc_chip_pb', name: 'Dark Chocolate Chip Peanut Butter Refrigerated Bar', brand: 'Perfect Bar', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 330, protein: 15, carbs: 24, fiber: 4, sugar: 18, fat: 20, saturatedFat: 4, sodium: 105 },
  { id: 'perfect_bar_peanut_butter', name: 'Peanut Butter Refrigerated Bar', brand: 'Perfect Bar', category: 'Protein Bar', servingSize: 71, servingUnit: 'bar', calories: 340, protein: 17, carbs: 27, fiber: 3, sugar: 19, fat: 19, saturatedFat: 3, sodium: 50 },
  { id: 'perfect_bar_almond_butter', name: 'Almond Butter Refrigerated Bar', brand: 'Perfect Bar', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 320, protein: 13, carbs: 25, fiber: 4, sugar: 18, fat: 19, saturatedFat: 1.5, sodium: 45 },
  { id: 'perfect_bar_blueberry_cashew', name: 'Blueberry Cashew Refrigerated Bar', brand: 'Perfect Bar', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 310, protein: 13, carbs: 27, fiber: 3, sugar: 19, fat: 18, saturatedFat: 2, sodium: 60 },
  { id: 'perfect_bar_coconut_pb', name: 'Coconut Peanut Butter Refrigerated Bar', brand: 'Perfect Bar', category: 'Protein Bar', servingSize: 71, servingUnit: 'bar', calories: 350, protein: 16, carbs: 26, fiber: 4, sugar: 19, fat: 22, saturatedFat: 6, sodium: 45 },

  // ══ GOMACRO MACROBAR ════════════════════════════════════════════════════════
  // Organic, vegan, plant-based bars. Source: gomacro.com
  { id: 'gomacro_protein_pleasure_pb_choc', name: 'Protein Pleasure Peanut Butter + Chocolate Chips MacroBar', brand: 'GoMacro', category: 'Protein Bar', servingSize: 68, servingUnit: 'bar', calories: 290, protein: 11, carbs: 39, fiber: 2, sugar: 8, fat: 10, saturatedFat: 2, sodium: 15 },
  { id: 'gomacro_protein_replenishment_banana_almond', name: 'Protein Replenishment Banana + Almond Butter MacroBar', brand: 'GoMacro', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 280, protein: 10, carbs: 36, fiber: 3, sugar: 8, fat: 11, saturatedFat: 1, sodium: 10 },
  { id: 'gomacro_overnight_oats_pb_choc', name: 'Overnight Oats Peanut Butter + Chocolate Chips MacroBar', brand: 'GoMacro', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 270, protein: 10, carbs: 35, fiber: 3, sugar: 9, fat: 10, saturatedFat: 2, sodium: 85 },
  { id: 'gomacro_cherries_berries', name: 'Cherries + Berries MacroBar', brand: 'GoMacro', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 260, protein: 9, carbs: 38, fiber: 2, sugar: 13, fat: 8, saturatedFat: 1, sodium: 10 },
  { id: 'gomacro_double_choc_pb_chips', name: 'Double Chocolate + Peanut Butter Chips MacroBar', brand: 'GoMacro', category: 'Protein Bar', servingSize: 65, servingUnit: 'bar', calories: 270, protein: 10, carbs: 34, fiber: 3, sugar: 9, fat: 10, saturatedFat: 2, sodium: 55 },

  // ══ NO COW ══════════════════════════════════════════════════════════════════
  // Plant-based, ~20g protein, low sugar, high fiber, 60g bars. Source: nocow.com / fatsecret.com / myfooddiary.com
  { id: 'no_cow_choc_fudge_brownie', name: 'Chocolate Fudge Brownie Protein Bar', brand: 'No Cow', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 210, protein: 20, carbs: 25, fiber: 14, sugar: 1, fat: 7, saturatedFat: 3, sodium: 200 },
  { id: 'no_cow_cookies_cream', name: "Cookies 'N Cream Protein Bar", brand: 'No Cow', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 210, protein: 20, carbs: 24, fiber: 11, sugar: 5, fat: 7, saturatedFat: 2.5, sodium: 210 },
  { id: 'no_cow_lemon_meringue', name: 'Lemon Meringue Pie Protein Bar', brand: 'No Cow', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 22, carbs: 25, fiber: 16, sugar: 1, fat: 4, saturatedFat: 1, sodium: 160 },
  { id: 'no_cow_peanut_butter_cup', name: 'Peanut Butter Cup Protein Bar', brand: 'No Cow', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 200, protein: 20, carbs: 25, fiber: 14, sugar: 1, fat: 7, saturatedFat: 2, sodium: 200 },
  { id: 'no_cow_birthday_cake', name: 'Birthday Cake Protein Bar', brand: 'No Cow', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 21, carbs: 27, fiber: 16, sugar: 1, fat: 4.5, saturatedFat: 1.5, sodium: 150 },

  // ══ GRENADE CARB KILLA ══════════════════════════════════════════════════════
  // UK-origin high protein, low sugar bars, 60g each. Source: grenade.com / eatthismuch.com / fatsecret.com
  { id: 'grenade_choc_chip_salted_caramel', name: 'Chocolate Chip Salted Caramel Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 230, protein: 20, carbs: 21, fiber: 3, sugar: 1, fat: 10, saturatedFat: 6, sodium: 115 },
  { id: 'grenade_dark_choc_raspberry', name: 'Dark Chocolate Raspberry Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 220, protein: 20, carbs: 21, fiber: 3, sugar: 0.5, fat: 10, saturatedFat: 6, sodium: 50 },
  { id: 'grenade_fudge_brownie', name: 'Fudge Brownie Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 236, protein: 20, carbs: 21, fiber: 2, sugar: 1.7, fat: 10, saturatedFat: 5.5, sodium: 204 },
  { id: 'grenade_peanut_nutter', name: 'Peanut Nutter Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 220, protein: 21, carbs: 22, fiber: 7, sugar: 2, fat: 9, saturatedFat: 3, sodium: 135 },
  { id: 'grenade_cookies_cream', name: 'Cookies & Cream Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 217, protein: 23, carbs: 21, fiber: 6, sugar: 2, fat: 8, saturatedFat: 4, sodium: 150 },
  { id: 'grenade_white_choc_cookie', name: 'White Chocolate Cookie Carb Killa Bar', brand: 'Grenade', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 220, protein: 22, carbs: 21, fiber: 6, sugar: 2, fat: 8, saturatedFat: 4, sodium: 150 },

  // ══ THINKTHIN (think!) HIGH PROTEIN ═════════════════════════════════════════
  // 20g protein, 0g sugar, 60g bars. Source: thinkproducts.com / fatsecret.com
  { id: 'thinkthin_brownie_crunch', name: 'Brownie Crunch High Protein Bar', brand: 'thinkThin', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 230, protein: 20, carbs: 23, fiber: 1, sugar: 0, fat: 8, saturatedFat: 3, sodium: 210 },
  { id: 'thinkthin_chocolate_fudge', name: 'Chocolate Fudge High Protein Bar', brand: 'thinkThin', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 230, protein: 20, carbs: 24, fiber: 1, sugar: 0, fat: 8, saturatedFat: 3, sodium: 190 },
  { id: 'thinkthin_chunky_pb', name: 'Chunky Peanut Butter High Protein Bar', brand: 'thinkThin', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 240, protein: 20, carbs: 23, fiber: 1, sugar: 0, fat: 10, saturatedFat: 3, sodium: 220 },
  { id: 'thinkthin_white_chocolate', name: 'White Chocolate High Protein Bar', brand: 'thinkThin', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 230, protein: 20, carbs: 20, fiber: 0, sugar: 0, fat: 8, saturatedFat: 3.5, sodium: 230 },
  { id: 'thinkthin_honey_pb', name: 'Honey Peanut Butter High Protein Bar', brand: 'thinkThin', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 230, protein: 20, carbs: 22, fiber: 1, sugar: 2, fat: 9, saturatedFat: 3, sodium: 200 },

  // ══ ALOHA ORGANIC PLANT-BASED ════════════════════════════════════════════════
  // USDA organic, vegan, ~14g protein, 56g bars. Source: aloha.com / nutritionvalue.org / fatsecret.com
  { id: 'aloha_peanut_butter_cup', name: 'Peanut Butter Cup Organic Protein Bar', brand: 'ALOHA', category: 'Protein Bar', servingSize: 56, servingUnit: 'bar', calories: 230, protein: 14, carbs: 26, fiber: 10, sugar: 5, fat: 10, saturatedFat: 3, sodium: 135 },
  { id: 'aloha_choc_chip_cookie_dough', name: 'Chocolate Chip Cookie Dough Organic Protein Bar', brand: 'ALOHA', category: 'Protein Bar', servingSize: 56, servingUnit: 'bar', calories: 230, protein: 14, carbs: 26, fiber: 10, sugar: 5, fat: 10, saturatedFat: 3, sodium: 130 },
  { id: 'aloha_chocolate_mint', name: 'Chocolate Mint Organic Protein Bar', brand: 'ALOHA', category: 'Protein Bar', servingSize: 56, servingUnit: 'bar', calories: 230, protein: 14, carbs: 20, fiber: 7, sugar: 10, fat: 9, saturatedFat: 3.5, sodium: 85 },
  { id: 'aloha_coconut_choc_almond', name: 'Coconut Chocolate Almond Organic Protein Bar', brand: 'ALOHA', category: 'Protein Bar', servingSize: 56, servingUnit: 'bar', calories: 260, protein: 14, carbs: 22, fiber: 6, sugar: 4, fat: 13, saturatedFat: 7, sodium: 70 },
  { id: 'aloha_pb_choc_chip', name: 'Peanut Butter Chocolate Chip Organic Protein Bar', brand: 'ALOHA', category: 'Protein Bar', servingSize: 56, servingUnit: 'bar', calories: 260, protein: 14, carbs: 20, fiber: 3, sugar: 13, fat: 14, saturatedFat: 2.5, sodium: 190 },

  // ══ VEGA PROTEIN BAR ════════════════════════════════════════════════════════
  // Plant-based, 20g protein, 70g bars. Source: myvega.com / eatthismuch.com
  { id: 'vega_chocolate_pb', name: 'Chocolate Peanut Butter Protein Bar', brand: 'Vega', category: 'Protein Bar', servingSize: 70, servingUnit: 'bar', calories: 290, protein: 20, carbs: 27, fiber: 4, sugar: 18, fat: 10, saturatedFat: 5, sodium: 290 },
  { id: 'vega_salted_caramel', name: 'Salted Caramel Protein Bar', brand: 'Vega', category: 'Protein Bar', servingSize: 70, servingUnit: 'bar', calories: 290, protein: 20, carbs: 26, fiber: 3, sugar: 16, fat: 10, saturatedFat: 4, sodium: 270 },
  { id: 'vega_coconut_almond', name: 'Coconut Almond Protein Snack Bar', brand: 'Vega', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 190, protein: 10, carbs: 22, fiber: 4, sugar: 11, fat: 8, saturatedFat: 4, sodium: 110 },
  { id: 'vega_chocolate_caramel', name: 'Chocolate Caramel Protein Snack Bar', brand: 'Vega', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 190, protein: 10, carbs: 21, fiber: 4, sugar: 11, fat: 8, saturatedFat: 4, sodium: 80 },

  // ══ MUNK PACK PROTEIN COOKIE ════════════════════════════════════════════════
  // Soft-baked protein cookies, 16g protein, full cookie = 84g. Source: munkpack.com / myfooddiary.com / eatthismuch.com
  { id: 'munkpack_pb_dark_choc_chip', name: 'Peanut Butter Dark Chocolate Chip Protein Cookie', brand: 'Munk Pack', category: 'Protein Bar', servingSize: 84, servingUnit: 'cookie', calories: 320, protein: 16, carbs: 34, fiber: 6, sugar: 16, fat: 16, saturatedFat: 2, sodium: 340 },
  { id: 'munkpack_double_dark_choc', name: 'Double Dark Chocolate Protein Cookie', brand: 'Munk Pack', category: 'Protein Bar', servingSize: 84, servingUnit: 'cookie', calories: 360, protein: 18, carbs: 34, fiber: 6, sugar: 16, fat: 20, saturatedFat: 4, sodium: 280 },
  { id: 'munkpack_oatmeal_raisin_spice', name: 'Oatmeal Raisin Spice Protein Cookie', brand: 'Munk Pack', category: 'Protein Bar', servingSize: 84, servingUnit: 'cookie', calories: 320, protein: 16, carbs: 36, fiber: 6, sugar: 16, fat: 12, saturatedFat: 2, sodium: 440 },
  { id: 'munkpack_lemon_poppy_seed', name: 'Lemon Poppy Seed Protein Cookie', brand: 'Munk Pack', category: 'Protein Bar', servingSize: 84, servingUnit: 'cookie', calories: 310, protein: 16, carbs: 34, fiber: 5, sugar: 15, fat: 12, saturatedFat: 1.5, sodium: 380 },

  // ══ DETOUR LOWER SUGAR WHEY PROTEIN BAR ═════════════════════════════════════
  // Whey protein, ~30g protein, large bars. Source: detourbar.com / eatthismuch.com
  { id: 'detour_caramel_peanut', name: 'Lower Sugar Caramel Peanut Whey Protein Bar', brand: 'Detour', category: 'Protein Bar', servingSize: 85, servingUnit: 'bar', calories: 340, protein: 30, carbs: 33, fiber: 2, sugar: 5, fat: 10, saturatedFat: 6, sodium: 480 },
  { id: 'detour_double_chocolate', name: 'Lower Sugar Double Chocolate Whey Protein Bar', brand: 'Detour', category: 'Protein Bar', servingSize: 85, servingUnit: 'bar', calories: 340, protein: 30, carbs: 34, fiber: 2, sugar: 5, fat: 9, saturatedFat: 6, sodium: 310 },
  { id: 'detour_pb_cream', name: 'Lower Sugar Peanut Butter Cream Whey Protein Bar', brand: 'Detour', category: 'Protein Bar', servingSize: 85, servingUnit: 'bar', calories: 350, protein: 30, carbs: 30, fiber: 2, sugar: 4, fat: 12, saturatedFat: 6, sodium: 400 },
  { id: 'detour_cookies_cream', name: "Lower Sugar Cookies 'N Cream Crunch Whey Protein Bar", brand: 'Detour', category: 'Protein Bar', servingSize: 85, servingUnit: 'bar', calories: 350, protein: 32, carbs: 30, fiber: 6, sugar: 9, fat: 11, saturatedFat: 6, sodium: 250 },

  // ══ POWER CRUNCH PROTO WHEY ══════════════════════════════════════════════════
  // Wafer-style bars, ~13g protein, high fat, 40g bars. Source: powercrunch.com / fatsecret.com
  { id: 'power_crunch_pb_creme', name: 'Peanut Butter Crème Original Protein Wafer Bar', brand: 'Power Crunch', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 220, protein: 13, carbs: 12, fiber: 1, sugar: 6, fat: 13, saturatedFat: 7, sodium: 120 },
  { id: 'power_crunch_triple_choc', name: 'Triple Chocolate Original Protein Wafer Bar', brand: 'Power Crunch', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 220, protein: 13, carbs: 11, fiber: 1, sugar: 5, fat: 13, saturatedFat: 7, sodium: 100 },
  { id: 'power_crunch_french_vanilla', name: 'French Vanilla Crème Original Protein Wafer Bar', brand: 'Power Crunch', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 220, protein: 14, carbs: 11, fiber: 1, sugar: 5, fat: 13, saturatedFat: 7, sodium: 100 },
  { id: 'power_crunch_cookies_creme', name: 'Cookies & Crème Original Protein Wafer Bar', brand: 'Power Crunch', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 220, protein: 13, carbs: 12, fiber: 1, sugar: 6, fat: 13, saturatedFat: 7, sodium: 115 },

  // ══ ATLAS BAR (GRASS-FED WHEY) ══════════════════════════════════════════════
  // 20g protein, 1g sugar, 54g bars. Source: atlasbars.com / openfoodfacts.org / eatthismuch.com
  { id: 'atlas_pb_choc_chip', name: 'Peanut Butter Chocolate Chip Protein Bar', brand: 'Atlas Bar', category: 'Protein Bar', servingSize: 54, servingUnit: 'bar', calories: 210, protein: 20, carbs: 19, fiber: 10, sugar: 1, fat: 9, saturatedFat: 4, sodium: 200 },
  { id: 'atlas_dark_choc_almond', name: 'Dark Chocolate Almond Protein Bar', brand: 'Atlas Bar', category: 'Protein Bar', servingSize: 54, servingUnit: 'bar', calories: 210, protein: 20, carbs: 18, fiber: 10, sugar: 1, fat: 10, saturatedFat: 3.5, sodium: 200 },
  { id: 'atlas_mint_choc_chip', name: 'Mint Chocolate Chip Protein Bar', brand: 'Atlas Bar', category: 'Protein Bar', servingSize: 54, servingUnit: 'bar', calories: 210, protein: 20, carbs: 18, fiber: 10, sugar: 1, fat: 10, saturatedFat: 4, sodium: 195 },
  { id: 'atlas_coconut_almond', name: 'Coconut Almond Protein Bar', brand: 'Atlas Bar', category: 'Protein Bar', servingSize: 54, servingUnit: 'bar', calories: 190, protein: 15, carbs: 17, fiber: 9, sugar: 1, fat: 10, saturatedFat: 4, sodium: 180 },

  // ══ RISE BAR ════════════════════════════════════════════════════════════════
  // Whole food, minimal ingredients, 15–20g protein, ~60g bars. Source: risebar.com
  { id: 'rise_almond_honey', name: 'Almond Honey Whey Protein Bar', brand: 'Rise Bar', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 280, protein: 18, carbs: 21, fiber: 4, sugar: 17, fat: 16, saturatedFat: 1, sodium: 40 },
  { id: 'rise_sunflower_cinnamon', name: 'Sunflower Cinnamon Pea Protein Bar', brand: 'Rise Bar', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 290, protein: 17, carbs: 18, fiber: 3, sugar: 14, fat: 17, saturatedFat: 2, sodium: 110 },
  { id: 'rise_mocha_almond', name: 'Mocha Almond Whey Protein Bar', brand: 'Rise Bar', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 270, protein: 15, carbs: 24, fiber: 4, sugar: 18, fat: 14, saturatedFat: 2, sodium: 45 },
  { id: 'rise_lemon_cashew', name: 'Lemon Cashew Pea Protein Bar', brand: 'Rise Bar', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 260, protein: 15, carbs: 23, fiber: 1, sugar: 15, fat: 13, saturatedFat: 2.5, sodium: 110 },

  // ══ IQBAR (BRAIN + BODY FUEL) ════════════════════════════════════════════════
  // Plant-based, keto-friendly, ~12g protein, 45g bars. Source: eatiqbar.com
  { id: 'iqbar_pb_chip', name: 'Peanut Butter Chip Brain + Body Protein Bar', brand: 'IQBAR', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 180, protein: 12, carbs: 13, fiber: 10, sugar: 1, fat: 12, saturatedFat: 3, sodium: 140 },
  { id: 'iqbar_dark_choc_almond_butter', name: 'Almond Butter Chip Brain + Body Protein Bar', brand: 'IQBAR', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 180, protein: 12, carbs: 13, fiber: 10, sugar: 1, fat: 12, saturatedFat: 3, sodium: 130 },
  { id: 'iqbar_matcha_chai', name: 'Matcha Chai Brain + Body Protein Bar', brand: 'IQBAR', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 170, protein: 12, carbs: 12, fiber: 9, sugar: 1, fat: 11, saturatedFat: 3, sodium: 115 },
  { id: 'iqbar_lemon_blueberry', name: 'Lemon Blueberry Brain + Body Protein Bar', brand: 'IQBAR', category: 'Protein Bar', servingSize: 45, servingUnit: 'bar', calories: 170, protein: 12, carbs: 12, fiber: 9, sugar: 1, fat: 11, saturatedFat: 2.5, sodium: 125 },

  // ══ MUSCLEPHARM COMBAT CRUNCH ════════════════════════════════════════════════
  // Baked multi-layer bars, 20g protein, 63g bars. Source: musclepharm.com / eatthismuch.com
  { id: 'combat_crunch_chocolate_cake', name: 'Chocolate Cake Combat Crunch Protein Bar', brand: 'MusclePharm', category: 'Protein Bar', servingSize: 63, servingUnit: 'bar', calories: 210, protein: 20, carbs: 25, fiber: 12, sugar: 5, fat: 7, saturatedFat: 4, sodium: 159 },
  { id: 'combat_crunch_choc_pb_cup', name: 'Chocolate Peanut Butter Cup Combat Crunch Protein Bar', brand: 'MusclePharm', category: 'Protein Bar', servingSize: 63, servingUnit: 'bar', calories: 210, protein: 20, carbs: 25, fiber: 12, sugar: 5, fat: 7, saturatedFat: 4, sodium: 159 },
  { id: 'combat_crunch_triple_choc', name: 'Triple Chocolate Combat Crunch Protein Bar', brand: 'MusclePharm', category: 'Protein Bar', servingSize: 63, servingUnit: 'bar', calories: 210, protein: 20, carbs: 25, fiber: 12, sugar: 5, fat: 7, saturatedFat: 4, sodium: 159 },
  { id: 'combat_crunch_white_choc_raspberry', name: 'White Chocolate Raspberry Combat Crunch Protein Bar', brand: 'MusclePharm', category: 'Protein Bar', servingSize: 63, servingUnit: 'bar', calories: 210, protein: 20, carbs: 25, fiber: 12, sugar: 5, fat: 7, saturatedFat: 4, sodium: 159 },

]
