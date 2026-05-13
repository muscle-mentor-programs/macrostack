import { FOODS_GROCERY } from './foods_grocery'
import { FOODS_GROCERY2 } from './foods_grocery2'
import { FOODS_GROCERY3 } from './foods_grocery3'
import { FOODS_GROCERY4 } from './foods_grocery4'
import { FOODS_RESTAURANT } from './foods_restaurant'
import { FOODS_RESTAURANT2 } from './foods_restaurant2'
import { FOODS_RESTAURANT3 } from './foods_restaurant3'
import { FOODS_RESTAURANT4 } from './foods_restaurant4'
import { FOODS_RESTAURANT5 } from './foods_restaurant5'
import { FOODS_RESTAURANT6 } from './foods_restaurant6'
import { FOODS_SUPPLEMENTS2 } from './foods_supplements2'
import { FOODS_BARS2 } from './foods_bars2'

// All macros are PER ONE SERVING (servingSize / servingUnit)
export const FOODS = [

  // ============================================================
  // QUEST NUTRITION
  // ============================================================
  { id: 'quest_choc_chip_cookie_dough', name: 'Chocolate Chip Cookie Dough Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 21, carbs: 22, fiber: 12, sugar: 1, fat: 9, saturatedFat: 3, sodium: 220 },
  { id: 'quest_cookies_cream', name: 'Cookies & Cream Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 21, carbs: 22, fiber: 13, sugar: 1, fat: 8, saturatedFat: 2.5, sodium: 290 },
  { id: 'quest_choc_peanut_butter', name: 'Chocolate Peanut Butter Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 20, carbs: 22, fiber: 11, sugar: 1, fat: 9, saturatedFat: 2.5, sodium: 220 },
  { id: 'quest_double_choc_chunk', name: 'Double Chocolate Chunk Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 170, protein: 20, carbs: 24, fiber: 12, sugar: 1, fat: 7, saturatedFat: 2, sodium: 240 },
  { id: 'quest_birthday_cake', name: 'Birthday Cake Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 25, fiber: 12, sugar: 1, fat: 7, saturatedFat: 4, sodium: 250 },
  { id: 'quest_white_choc_raspberry', name: 'White Chocolate Raspberry Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 23, fiber: 13, sugar: 1, fat: 7, saturatedFat: 2.5, sodium: 240 },
  { id: 'quest_lemon_cake', name: 'Lemon Cake Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 24, fiber: 13, sugar: 1, fat: 7, saturatedFat: 2.5, sodium: 210 },
  { id: 'quest_smores', name: "S'Mores Bar", brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 190, protein: 21, carbs: 23, fiber: 12, sugar: 1, fat: 7, saturatedFat: 2.5, sodium: 230 },
  { id: 'quest_blueberry_muffin', name: 'Blueberry Muffin Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 23, fiber: 13, sugar: 2, fat: 7, saturatedFat: 2, sodium: 220 },
  { id: 'quest_apple_pie', name: 'Apple Pie Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 170, protein: 20, carbs: 24, fiber: 13, sugar: 2, fat: 6, saturatedFat: 1, sodium: 230 },
  { id: 'quest_oatmeal_choc_chip', name: 'Oatmeal Chocolate Chip Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 24, fiber: 14, sugar: 1, fat: 7, saturatedFat: 1.5, sodium: 210 },
  { id: 'quest_mint_choc_chunk', name: 'Mint Chocolate Chunk Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 180, protein: 20, carbs: 24, fiber: 14, sugar: 1, fat: 7, saturatedFat: 3, sodium: 230 },
  { id: 'quest_choc_brownie', name: 'Chocolate Brownie Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 170, protein: 20, carbs: 24, fiber: 15, sugar: 1, fat: 6, saturatedFat: 1, sodium: 240 },
  { id: 'quest_strawberry_shortcake', name: 'Strawberry Shortcake Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 60, servingUnit: 'bar', calories: 200, protein: 20, carbs: 21, fiber: 10, sugar: 2, fat: 10, saturatedFat: 6, sodium: 230 },
  { id: 'quest_dipped_choc_chip_cookie_dough', name: 'Dipped Chocolate Chip Cookie Dough Bar', brand: 'Quest', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 180, protein: 18, carbs: 16, fiber: 8, sugar: 1, fat: 9, saturatedFat: 5, sodium: 170 },
  { id: 'quest_mini_choc_chip_cookie_dough', name: 'Mini Chocolate Chip Cookie Dough Bars', brand: 'Quest', category: 'Protein Bar', servingSize: 23, servingUnit: 'bar', calories: 80, protein: 8, carbs: 9, fiber: 5, sugar: 1, fat: 3.5, saturatedFat: 1, sodium: 85 },
  { id: 'quest_chips_nacho_cheese', name: 'Nacho Cheese Tortilla Style Protein Chips', brand: 'Quest', category: 'Protein Chip', servingSize: 32, servingUnit: 'bag', calories: 150, protein: 18, carbs: 5, fiber: 1, sugar: 1, fat: 6, saturatedFat: 1.5, sodium: 330 },
  { id: 'quest_chips_chili_lime', name: 'Chili Lime Tortilla Style Protein Chips', brand: 'Quest', category: 'Protein Chip', servingSize: 32, servingUnit: 'bag', calories: 140, protein: 20, carbs: 4, fiber: 1, sugar: 1, fat: 4.5, saturatedFat: 1, sodium: 320 },
  { id: 'quest_chips_bbq', name: 'BBQ Original Style Protein Chips', brand: 'Quest', category: 'Protein Chip', servingSize: 32, servingUnit: 'bag', calories: 140, protein: 19, carbs: 5, fiber: 1, sugar: 1, fat: 5, saturatedFat: 1, sodium: 330 },
  { id: 'quest_cookie_choc_chip', name: 'Chocolate Chip Protein Cookie', brand: 'Quest', category: 'Protein Cookie', servingSize: 59, servingUnit: 'cookie', calories: 240, protein: 15, carbs: 19, fiber: 9, sugar: 1, fat: 17, saturatedFat: 10, sodium: 210 },
  { id: 'quest_frosted_cookie_choc_cake', name: 'Chocolate Cake Frosted Cookie', brand: 'Quest', category: 'Protein Cookie', servingSize: 50, servingUnit: 'cookie', calories: 190, protein: 11, carbs: 18, fiber: 6, sugar: 1, fat: 13, saturatedFat: 4.5, sodium: 190 },
  { id: 'quest_frosted_cookie_strawberry', name: 'Strawberry Cake Frosted Cookie', brand: 'Quest', category: 'Protein Cookie', servingSize: 50, servingUnit: 'cookie', calories: 200, protein: 10, carbs: 19, fiber: 5, sugar: 1, fat: 14, saturatedFat: 4.5, sodium: 170 },
  { id: 'quest_frosted_cookie_birthday_cake', name: 'Birthday Cake Frosted Cookie', brand: 'Quest', category: 'Protein Cookie', servingSize: 50, servingUnit: 'cookie', calories: 190, protein: 10, carbs: 19, fiber: 5, sugar: 1, fat: 14, saturatedFat: 4.5, sodium: 160 },

  // ============================================================
  // BAREBELLS
  // ============================================================
  { id: 'barebells_cookies_caramel', name: 'Cookies & Caramel Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 21, fiber: 4, sugar: 1, fat: 7, saturatedFat: 3.5, sodium: 150 },
  { id: 'barebells_caramel_cashew', name: 'Caramel Cashew Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 3, sugar: 1, fat: 8, saturatedFat: 3.5, sodium: 80 },
  { id: 'barebells_choc_dough', name: 'Chocolate Dough Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 20, fiber: 3, sugar: 1, fat: 7, saturatedFat: 3.5, sodium: 150 },
  { id: 'barebells_salty_peanut', name: 'Salty Peanut Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 3, sugar: 1, fat: 8, saturatedFat: 3.5, sodium: 105 },
  { id: 'barebells_creamy_crisp', name: 'Creamy Crisp Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 19, fiber: 3, sugar: 1, fat: 8, saturatedFat: 3.5, sodium: 120 },
  { id: 'barebells_cookies_cream', name: 'Cookies & Cream Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 20, fiber: 3, sugar: 1, fat: 7, saturatedFat: 3, sodium: 75 },
  { id: 'barebells_pb_jelly', name: 'Peanut Butter & Jelly Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 21, fiber: 2, sugar: 2, fat: 6, saturatedFat: 3, sodium: 150 },
  { id: 'barebells_white_choc_almond', name: 'White Chocolate Almond Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 19, fiber: 4, sugar: 1, fat: 8, saturatedFat: 3.5, sodium: 110 },
  { id: 'barebells_key_lime_pie', name: 'Key Lime Pie Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 3, sugar: 1, fat: 7, saturatedFat: 3.5, sodium: 140 },
  { id: 'barebells_peanut_butter', name: 'Peanut Butter Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 20, fiber: 3, sugar: 2, fat: 8, saturatedFat: 3.5, sodium: 210 },
  { id: 'barebells_orange_creamsicle', name: 'Orange Creamsicle Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 20, fiber: 3, sugar: 2, fat: 7, saturatedFat: 4, sodium: 85 },
  { id: 'barebells_mint_choc_crisp', name: 'Mint Chocolate Crisp Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 20, fiber: 3, sugar: 1, fat: 7, saturatedFat: 3.5, sodium: 120 },
  { id: 'barebells_brownie_batter', name: 'Brownie Batter Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 20, fiber: 3, sugar: 1, fat: 8, saturatedFat: 4, sodium: 150 },
  { id: 'barebells_birthday_cake', name: 'Birthday Cake Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 20, fiber: 2, sugar: 1, fat: 7, saturatedFat: 3.5, sodium: 120 },
  { id: 'barebells_lemon_cheesecake', name: 'Lemon Cheesecake Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 18, fiber: 2, sugar: 1, fat: 8, saturatedFat: 4, sodium: 125 },
  { id: 'barebells_wild_cherry', name: 'Wild Cherry Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 20, carbs: 19, fiber: 3, sugar: 1, fat: 8, saturatedFat: 4, sodium: 110 },
  { id: 'barebells_soft_salted_peanut_caramel', name: 'Salted Peanut Caramel Soft Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 16, carbs: 21, fiber: 5, sugar: 2, fat: 11, saturatedFat: 4.5, sodium: 220 },
  { id: 'barebells_soft_caramel_choco', name: 'Caramel Choco Soft Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 16, carbs: 24, fiber: 5, sugar: 2, fat: 9, saturatedFat: 4, sodium: 190 },
  { id: 'barebells_soft_banana_caramel', name: 'Banana Caramel Soft Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 200, protein: 16, carbs: 24, fiber: 5, sugar: 2, fat: 9, saturatedFat: 4, sodium: 160 },
  { id: 'barebells_vegan_caramel_choco_chip', name: 'Vegan Caramel Choco Chip Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 15, carbs: 24, fiber: 2, sugar: 2, fat: 8, saturatedFat: 3.5, sodium: 230 },
  { id: 'barebells_vegan_fudge_brownie', name: 'Vegan Fudge Brownie Bar', brand: 'Barebells', category: 'Protein Bar', servingSize: 55, servingUnit: 'bar', calories: 210, protein: 15, carbs: 24, fiber: 3, sugar: 2, fat: 9, saturatedFat: 4, sodium: 220 },
  { id: 'barebells_protein_soda_sweet_cherry', name: 'Sweet Cherry Protein Soda', brand: 'Barebells', category: 'RTD Shake', servingSize: 355, servingUnit: 'can', calories: 50, protein: 10, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 10 },
  { id: 'barebells_protein_soda_pineapple', name: 'Pineapple Sunrise Protein Soda', brand: 'Barebells', category: 'RTD Shake', servingSize: 355, servingUnit: 'can', calories: 50, protein: 10, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 10 },
  { id: 'barebells_protein_soda_wild_strawberry', name: 'Wild Strawberry Protein Soda', brand: 'Barebells', category: 'RTD Shake', servingSize: 355, servingUnit: 'can', calories: 50, protein: 10, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 10 },
  { id: 'barebells_milk_drink_chocolate', name: 'Chocolate Milk Drink', brand: 'Barebells', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 130, protein: 24, carbs: 3, fiber: 0, sugar: 2, fat: 2, saturatedFat: 1.5, sodium: 200 },
  { id: 'barebells_milk_drink_vanilla', name: 'Vanilla Milk Drink', brand: 'Barebells', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 120, protein: 24, carbs: 2, fiber: 0, sugar: 2, fat: 2, saturatedFat: 1.5, sodium: 180 },

  // ============================================================
  // DAVID PROTEIN
  // ============================================================
  { id: 'david_choc_chip_cookie_dough', name: 'Chocolate Chip Cookie Dough Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 14, fiber: 2, sugar: 0, fat: 2, saturatedFat: 2, sodium: 230 },
  { id: 'david_fudge_brownie', name: 'Fudge Brownie Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 14, fiber: 2, sugar: 0, fat: 2, saturatedFat: 2, sodium: 230 },
  { id: 'david_cinnamon_roll', name: 'Cinnamon Roll Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 14, fiber: 2, sugar: 0, fat: 2, saturatedFat: 2, sodium: 230 },
  { id: 'david_red_velvet', name: 'Red Velvet Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 12, fiber: 2, sugar: 0, fat: 2.5, saturatedFat: 2, sodium: 230 },
  { id: 'david_cake_batter', name: 'Cake Batter Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 12, fiber: 2, sugar: 0, fat: 2, saturatedFat: 2, sodium: 230 },
  { id: 'david_salted_peanut_butter', name: 'Salted Peanut Butter Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 13, fiber: 2, sugar: 0, fat: 3, saturatedFat: 2, sodium: 180 },
  { id: 'david_blueberry_pie', name: 'Blueberry Pie Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 13, fiber: 2, sugar: 0, fat: 2, saturatedFat: 2, sodium: 130 },
  { id: 'david_pb_choc_chunk', name: 'Peanut Butter Chocolate Chunk Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 28, carbs: 13, fiber: 2, sugar: 0, fat: 3, saturatedFat: 2, sodium: 190 },
  { id: 'david_smores', name: "S'mores Chocolate Crunch Bar", brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 20, carbs: 18, fiber: 5, sugar: 0, fat: 4, saturatedFat: 2, sodium: 150 },
  { id: 'david_double_chocolate', name: 'Double Chocolate Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 20, carbs: 18, fiber: 5, sugar: 0, fat: 4, saturatedFat: 2, sodium: 150 },
  { id: 'david_pb_chocolate', name: 'Peanut Butter Chocolate Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 20, carbs: 18, fiber: 5, sugar: 0, fat: 4, saturatedFat: 2, sodium: 150 },
  { id: 'david_cookie_dough_caramel', name: 'Cookie Dough Caramel Chocolate Bar', brand: 'David', category: 'Protein Bar', servingSize: 58, servingUnit: 'bar', calories: 150, protein: 20, carbs: 18, fiber: 5, sugar: 0, fat: 4, saturatedFat: 2, sodium: 150 },

  // ============================================================
  // BUILT BAR
  // ============================================================
  { id: 'built_puff_brownie_batter', name: 'Brownie Batter Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 95 },
  { id: 'built_puff_peanut_butter_cup', name: 'Peanut Butter Cup Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 150, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_puff_cookie_dough_chunk', name: 'Cookie Dough Chunk Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 44, servingUnit: 'bar', calories: 160, protein: 15, carbs: 19, fiber: 0, sugar: 8, fat: 4, saturatedFat: 3, sodium: 80 },
  { id: 'built_puff_banana_cream_pie', name: 'Banana Cream Pie Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 7, fat: 3, saturatedFat: 2, sodium: 95 },
  { id: 'built_puff_strawberries_cream', name: "Strawberries 'N Cream Puff", brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 15, carbs: 15, fiber: 0, sugar: 8, fat: 3, saturatedFat: 3, sodium: 85 },
  { id: 'built_puff_churro', name: 'Churro Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_puff_coconut', name: 'Coconut Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_puff_smores', name: "S'mores Chunk Puff", brand: 'Built Bar', category: 'Protein Bar', servingSize: 43, servingUnit: 'bar', calories: 160, protein: 15, carbs: 18, fiber: 0, sugar: 9, fat: 4, saturatedFat: 3, sodium: 115 },
  { id: 'built_puff_mint_chip', name: 'Mint Chip Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 95 },
  { id: 'built_puff_salted_caramel', name: 'Salted Caramel Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_puff_chocolate_milkshake', name: 'Chocolate Milkshake Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 140, protein: 17, carbs: 14, fiber: 0, sugar: 6, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_sour_blue_razz', name: 'Blue Razz Blast Sour Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 150, protein: 15, carbs: 16, fiber: 0, sugar: 8, fat: 3, saturatedFat: 2, sodium: 90 },
  { id: 'built_sour_green_apple', name: 'Green Apple Crush Sour Puff', brand: 'Built Bar', category: 'Protein Bar', servingSize: 40, servingUnit: 'bar', calories: 150, protein: 15, carbs: 16, fiber: 0, sugar: 8, fat: 3, saturatedFat: 2, sodium: 90 },

  // ============================================================
  // LEGENDARY FOODS
  // ============================================================
  { id: 'legendary_pastry_strawberry', name: 'Strawberry Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 9, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_pastry_brown_sugar_cinnamon', name: 'Brown Sugar Cinnamon Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 9, sugar: 0.5, fat: 8, saturatedFat: 1, sodium: 370 },
  { id: 'legendary_pastry_blueberry', name: 'Blueberry Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 9, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_pastry_smores', name: "S'mores Protein Pastry", brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 8, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_pastry_chocolate_cake', name: 'Chocolate Cake Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 9, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_pastry_hot_fudge', name: 'Hot Fudge Sundae Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 8, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_pastry_birthday_cake', name: 'Birthday Cake Protein Pastry', brand: 'Legendary Foods', category: 'Protein Bar', servingSize: 61, servingUnit: 'pastry', calories: 180, protein: 20, carbs: 22, fiber: 8, sugar: 0.5, fat: 8, saturatedFat: 2, sodium: 370 },
  { id: 'legendary_donut_vanilla_glazed', name: 'Vanilla Glazed Protein Donuts', brand: 'Legendary Foods', category: 'Protein Donut', servingSize: 65, servingUnit: '2 donuts', calories: 160, protein: 20, carbs: 26, fiber: 8, sugar: 0, fat: 6, saturatedFat: 1, sodium: 390 },
  { id: 'legendary_donut_cinnamon_crumble', name: 'Cinnamon Crumble Protein Donuts', brand: 'Legendary Foods', category: 'Protein Donut', servingSize: 65, servingUnit: '2 donuts', calories: 160, protein: 20, carbs: 26, fiber: 8, sugar: 0, fat: 6, saturatedFat: 1, sodium: 260 },
  { id: 'legendary_donut_chocolate_dipped', name: 'Chocolate Dipped Protein Donuts', brand: 'Legendary Foods', category: 'Protein Donut', servingSize: 65, servingUnit: '2 donuts', calories: 160, protein: 20, carbs: 26, fiber: 8, sugar: 0, fat: 6, saturatedFat: 1, sodium: 260 },
  { id: 'legendary_donut_pink_sprinkle', name: 'Pink Sprinkle Protein Donuts', brand: 'Legendary Foods', category: 'Protein Donut', servingSize: 65, servingUnit: '2 donuts', calories: 160, protein: 20, carbs: 26, fiber: 8, sugar: 0, fat: 6, saturatedFat: 1, sodium: 260 },

  // ============================================================
  // OPTIMUM NUTRITION
  // ============================================================
  { id: 'on_gsw_double_rich_chocolate', name: 'Gold Standard Whey - Double Rich Chocolate', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 1, sugar: 1, fat: 1.5, saturatedFat: 0.5, sodium: 130 },
  { id: 'on_gsw_vanilla_ice_cream', name: 'Gold Standard Whey - Vanilla Ice Cream', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 4, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0.5, sodium: 105 },
  { id: 'on_gsw_cookies_cream', name: 'Gold Standard Whey - Cookies & Cream', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 33, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 0, sugar: 3, fat: 1.5, saturatedFat: 1, sodium: 200 },
  { id: 'on_gsw_choc_peanut_butter', name: 'Gold Standard Whey - Chocolate Peanut Butter', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 33, servingUnit: 'scoop', calories: 130, protein: 24, carbs: 4, fiber: 0, sugar: 2, fat: 2, saturatedFat: 1, sodium: 190 },
  { id: 'on_gsw_strawberry', name: 'Gold Standard Whey - Delicious Strawberry', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 0, sugar: 2, fat: 1.5, saturatedFat: 1, sodium: 130 },
  { id: 'on_gsw_french_vanilla', name: 'Gold Standard Whey - French Vanilla Creme', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 2, fiber: 0, sugar: 2, fat: 1.5, saturatedFat: 1, sodium: 130 },
  { id: 'on_gsw_banana_cream', name: 'Gold Standard Whey - Banana Cream', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 2, sugar: 2, fat: 2, saturatedFat: 1, sodium: 130 },
  { id: 'on_gs_isolate_chocolate', name: 'Gold Standard Isolate - Chocolate Bliss', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 1, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 190 },
  { id: 'on_gs_isolate_vanilla', name: 'Gold Standard Isolate - Rich Vanilla', brand: 'Optimum Nutrition', category: 'Whey Protein', servingSize: 31, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 1, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 190 },
  { id: 'on_gs_casein_chocolate', name: 'Gold Standard Casein - Chocolate Supreme', brand: 'Optimum Nutrition', category: 'Casein Protein', servingSize: 33, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 4, fiber: 1, sugar: 1, fat: 1, saturatedFat: 0.5, sodium: 260 },
  { id: 'on_gs_casein_vanilla', name: 'Gold Standard Casein - Creamy Vanilla', brand: 'Optimum Nutrition', category: 'Casein Protein', servingSize: 32, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 1, sugar: 1, fat: 0.5, saturatedFat: 0.5, sodium: 220 },
  { id: 'on_gs_casein_cookies_cream', name: 'Gold Standard Casein - Cookies & Cream', brand: 'Optimum Nutrition', category: 'Casein Protein', servingSize: 33, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0.5, sodium: 240 },
  { id: 'on_serious_mass_chocolate', name: 'Serious Mass - Chocolate', brand: 'Optimum Nutrition', category: 'Mass Gainer', servingSize: 340, servingUnit: '2 scoops', calories: 1260, protein: 50, carbs: 254, fiber: 0, sugar: 30, fat: 5, saturatedFat: 3, sodium: 670 },
  { id: 'on_serious_mass_vanilla', name: 'Serious Mass - Vanilla', brand: 'Optimum Nutrition', category: 'Mass Gainer', servingSize: 340, servingUnit: '2 scoops', calories: 1260, protein: 50, carbs: 254, fiber: 0, sugar: 30, fat: 5, saturatedFat: 3, sodium: 670 },
  { id: 'on_gs_rtd_chocolate', name: 'Gold Standard RTD - Chocolate', brand: 'Optimum Nutrition', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 24, carbs: 5, fiber: 0, sugar: 1, fat: 3.5, saturatedFat: 1, sodium: 200 },
  { id: 'on_gs_rtd_vanilla', name: 'Gold Standard RTD - Vanilla', brand: 'Optimum Nutrition', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 24, carbs: 5, fiber: 0, sugar: 1, fat: 3.5, saturatedFat: 1, sodium: 190 },
  { id: 'on_gs_rtd_strawberry', name: 'Gold Standard RTD - Strawberry', brand: 'Optimum Nutrition', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 24, carbs: 5, fiber: 0, sugar: 1, fat: 3.5, saturatedFat: 1, sodium: 190 },

  // ============================================================
  // DYMATIZE
  // ============================================================
  { id: 'dymatize_iso100_gourmet_chocolate', name: 'ISO100 Hydrolyzed Whey - Gourmet Chocolate', brand: 'Dymatize', category: 'Whey Protein', servingSize: 32, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 180 },
  { id: 'dymatize_iso100_gourmet_vanilla', name: 'ISO100 Hydrolyzed Whey - Gourmet Vanilla', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 120 },
  { id: 'dymatize_iso100_fudge_brownie', name: 'ISO100 Hydrolyzed Whey - Fudge Brownie', brand: 'Dymatize', category: 'Whey Protein', servingSize: 33, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 3, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 210 },
  { id: 'dymatize_iso100_cookies_cream', name: 'ISO100 Hydrolyzed Whey - Cookies & Cream', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 130 },
  { id: 'dymatize_iso100_fruity_pebbles', name: 'ISO100 Hydrolyzed Whey - Fruity Pebbles', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 120 },
  { id: 'dymatize_iso100_cocoa_pebbles', name: 'ISO100 Hydrolyzed Whey - Cocoa Pebbles', brand: 'Dymatize', category: 'Whey Protein', servingSize: 32, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 200 },
  { id: 'dymatize_iso100_strawberry', name: 'ISO100 Hydrolyzed Whey - Strawberry', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 75 },
  { id: 'dymatize_iso100_salted_caramel', name: 'ISO100 Hydrolyzed Whey - Salted Caramel', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 190 },
  { id: 'dymatize_iso100_dunkin_glazed_donut', name: "ISO100 Hydrolyzed Whey - Dunkin' Glazed Donut", brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 120 },
  { id: 'dymatize_iso100_cinnamon_cereal', name: 'ISO100 Hydrolyzed Whey - Cinnamon Cereal', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 120 },
  { id: 'dymatize_iso100_birthday_cake_pebbles', name: 'ISO100 Hydrolyzed Whey - Birthday Cake Pebbles', brand: 'Dymatize', category: 'Whey Protein', servingSize: 30, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 1, fat: 1, saturatedFat: 0, sodium: 180 },
  { id: 'dymatize_elite_whey_chocolate', name: 'Elite 100% Whey - Rich Chocolate', brand: 'Dymatize', category: 'Whey Protein', servingSize: 36, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 3, fiber: 0, sugar: 2, fat: 3, saturatedFat: 2, sodium: 160 },
  { id: 'dymatize_elite_whey_vanilla', name: 'Elite 100% Whey - Gourmet Vanilla', brand: 'Dymatize', category: 'Whey Protein', servingSize: 34, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 2, fiber: 0, sugar: 2, fat: 3, saturatedFat: 1.5, sodium: 95 },
  { id: 'dymatize_elite_casein_chocolate', name: 'Elite Casein - Rich Chocolate', brand: 'Dymatize', category: 'Casein Protein', servingSize: 36, servingUnit: 'scoop', calories: 130, protein: 25, carbs: 3, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0, sodium: 180 },
  { id: 'dymatize_elite_casein_vanilla', name: 'Elite Casein - Smooth Vanilla', brand: 'Dymatize', category: 'Casein Protein', servingSize: 33, servingUnit: 'scoop', calories: 120, protein: 25, carbs: 2, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 100 },
  { id: 'dymatize_super_mass_chocolate', name: 'Super Mass Gainer - Rich Chocolate', brand: 'Dymatize', category: 'Mass Gainer', servingSize: 335, servingUnit: '2.5 scoops', calories: 1280, protein: 52, carbs: 245, fiber: 3, sugar: 21, fat: 11, saturatedFat: 3, sodium: 580 },
  { id: 'dymatize_super_mass_vanilla', name: 'Super Mass Gainer - Gourmet Vanilla', brand: 'Dymatize', category: 'Mass Gainer', servingSize: 333, servingUnit: '2.5 scoops', calories: 1280, protein: 52, carbs: 245, fiber: 0, sugar: 23, fat: 10, saturatedFat: 2.5, sodium: 450 },

  // ============================================================
  // RYSE
  // ============================================================
  { id: 'ryse_loaded_marshmallow', name: 'Loaded Protein - Jet-Puffed Marshmallow', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 130, protein: 25, carbs: 3, fiber: 0, sugar: 1, fat: 2.5, saturatedFat: 2, sodium: 240 },
  { id: 'ryse_loaded_cinnamon_toast', name: 'Loaded Protein - Cinnamon Toast', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 4, fiber: 1, sugar: 2, fat: 2.5, saturatedFat: 1.5, sodium: 260 },
  { id: 'ryse_loaded_skippy_pb', name: 'Loaded Protein - Skippy Peanut Butter', brand: 'Ryse', category: 'Whey Protein', servingSize: 40, servingUnit: 'scoop', calories: 150, protein: 25, carbs: 5, fiber: 1, sugar: 2, fat: 3, saturatedFat: 2, sodium: 280 },
  { id: 'ryse_loaded_blueberry_muffin', name: 'Loaded Protein - Blueberry Muffin', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 4, fiber: 1, sugar: 2, fat: 2.5, saturatedFat: 1.5, sodium: 260 },
  { id: 'ryse_loaded_cosmic_brownie', name: 'Loaded Protein - Little Debbie Cosmic Brownies', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 4, fiber: 1, sugar: 2, fat: 2.5, saturatedFat: 1.5, sodium: 260 },
  { id: 'ryse_loaded_strawberry_shortcake', name: 'Loaded Protein - Strawberry Shortcake Rolls', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 4, fiber: 1, sugar: 2, fat: 2.5, saturatedFat: 1.5, sodium: 260 },
  { id: 'ryse_loaded_milk_chocolate', name: 'Loaded Protein - Milk Chocolate', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 130, protein: 25, carbs: 3, fiber: 0, sugar: 1, fat: 2.5, saturatedFat: 2, sodium: 240 },
  { id: 'ryse_loaded_vanilla_ice_cream', name: 'Loaded Protein - Vanilla Ice Cream', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 130, protein: 25, carbs: 3, fiber: 0, sugar: 1, fat: 2.5, saturatedFat: 1.5, sodium: 240 },
  { id: 'ryse_loaded_banana_pudding', name: 'Loaded Protein - Banana Pudding', brand: 'Ryse', category: 'Whey Protein', servingSize: 35, servingUnit: 'scoop', calories: 130, protein: 25, carbs: 3, fiber: 1, sugar: 1, fat: 2.5, saturatedFat: 1.5, sodium: 240 },
  { id: 'ryse_loaded_mint_chip', name: 'Loaded Protein - Mint Chip Ice Cream', brand: 'Ryse', category: 'Whey Protein', servingSize: 37, servingUnit: 'scoop', calories: 140, protein: 25, carbs: 5, fiber: 1, sugar: 2, fat: 2.5, saturatedFat: 1.5, sodium: 260 },
  { id: 'ryse_clear_whey_tropical_punch', name: 'Clear Whey RTD - Kool-Aid Tropical Punch', brand: 'Ryse', category: 'RTD Shake', servingSize: 500, servingUnit: 'bottle', calories: 100, protein: 22, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 85 },
  { id: 'ryse_clear_whey_lemonade', name: 'Clear Whey RTD - Country Time Lemonade', brand: 'Ryse', category: 'RTD Shake', servingSize: 500, servingUnit: 'bottle', calories: 100, protein: 22, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 85 },
  { id: 'ryse_clear_whey_pineapple', name: 'Clear Whey RTD - Pineapple', brand: 'Ryse', category: 'RTD Shake', servingSize: 500, servingUnit: 'bottle', calories: 100, protein: 22, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 85 },

  // ============================================================
  // PREMIER PROTEIN
  // ============================================================
  { id: 'premier_chocolate', name: 'Chocolate Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 340, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 4, fiber: 2, sugar: 1, fat: 3, saturatedFat: 1, sodium: 230 },
  { id: 'premier_vanilla', name: 'Vanilla Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 3, fiber: 0, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 250 },
  { id: 'premier_caramel', name: 'Caramel Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 2, fiber: 0, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 350 },
  { id: 'premier_cafe_latte', name: 'Café Latte Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 4, fiber: 1, sugar: 1, fat: 3, saturatedFat: 1, sodium: 260 },
  { id: 'premier_strawberries_cream', name: 'Strawberries & Cream Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 4, fiber: 1, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 230 },
  { id: 'premier_cookies_cream', name: 'Cookies & Cream Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 4, fiber: 1, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 220 },
  { id: 'premier_bananas_cream', name: 'Bananas & Cream Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 4, fiber: 1, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 230 },
  { id: 'premier_peaches_cream', name: 'Peaches & Cream Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 3, fiber: 1, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 230 },
  { id: 'premier_cinnamon_roll', name: 'Cinnamon Roll Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 2, fiber: 1, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 230 },
  { id: 'premier_lemon_bar', name: 'Lemon Bar Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 3, fiber: 0, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 250 },
  { id: 'premier_choc_peanut_butter', name: 'Chocolate Peanut Butter Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 6, fiber: 3, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 380 },
  { id: 'premier_cookie_dough', name: 'Cookie Dough Protein Shake', brand: 'Premier Protein', category: 'RTD Shake', servingSize: 340, servingUnit: 'bottle', calories: 160, protein: 30, carbs: 3, fiber: 1, sugar: 1, fat: 3, saturatedFat: 1, sodium: 330 },
  { id: 'premier_bar_choc_peanut_butter', name: 'Chocolate Peanut Butter Protein Bar', brand: 'Premier Protein', category: 'Protein Bar', servingSize: 72, servingUnit: 'bar', calories: 290, protein: 30, carbs: 25, fiber: 3, sugar: 8, fat: 8, saturatedFat: 4, sodium: 440 },
  { id: 'premier_bar_choc_brownie', name: 'Chocolate Brownie Protein Bar', brand: 'Premier Protein', category: 'Protein Bar', servingSize: 59, servingUnit: 'bar', calories: 230, protein: 20, carbs: 20, fiber: 2, sugar: 1, fat: 10, saturatedFat: 7, sodium: 170 },
  { id: 'premier_bar_salted_caramel', name: 'Salted Caramel Protein Bar', brand: 'Premier Protein', category: 'Protein Bar', servingSize: 72, servingUnit: 'bar', calories: 290, protein: 30, carbs: 26, fiber: 3, sugar: 11, fat: 7, saturatedFat: 4, sodium: 420 },

  // ============================================================
  // PURE PROTEIN
  // ============================================================
  { id: 'pure_choc_deluxe', name: 'Chocolate Deluxe Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 180, protein: 21, carbs: 17, fiber: 2, sugar: 3, fat: 4.5, saturatedFat: 3.5, sodium: 90 },
  { id: 'pure_choc_peanut_butter', name: 'Chocolate Peanut Butter Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 200, protein: 20, carbs: 17, fiber: 1, sugar: 2, fat: 7, saturatedFat: 3, sodium: 200 },
  { id: 'pure_chewy_choc_chip', name: 'Chewy Chocolate Chip Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 2, sugar: 3, fat: 5, saturatedFat: 3.5, sodium: 110 },
  { id: 'pure_birthday_cake', name: 'Birthday Cake Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 0, sugar: 3, fat: 5, saturatedFat: 3.5, sodium: 160 },
  { id: 'pure_strawberry_greek_yogurt', name: 'Strawberry Greek Yogurt Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 190, protein: 20, carbs: 19, fiber: 1, sugar: 4, fat: 4, saturatedFat: 2.5, sodium: 15 },
  { id: 'pure_lemon_cake', name: 'Lemon Cake Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 190, protein: 20, carbs: 16, fiber: 4, sugar: 2, fat: 7, saturatedFat: 4, sodium: 100 },
  { id: 'pure_caramel_churro', name: 'Caramel Churro Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 200, protein: 20, carbs: 18, fiber: 1, sugar: 2, fat: 7, saturatedFat: 4, sodium: 130 },
  { id: 'pure_choc_salted_caramel', name: 'Chocolate Salted Caramel Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 200, protein: 19, carbs: 20, fiber: 0, sugar: 3, fat: 5, saturatedFat: 4.5, sodium: 220 },
  { id: 'pure_cocoa_pebbles', name: 'Cocoa PEBBLES Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 180, protein: 20, carbs: 20, fiber: 1, sugar: 4, fat: 3.5, saturatedFat: 2.5, sodium: 170 },
  { id: 'pure_fruity_pebbles', name: 'Fruity PEBBLES Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 190, protein: 20, carbs: 19, fiber: 2, sugar: 3, fat: 4.5, saturatedFat: 2.5, sodium: 190 },
  { id: 'pure_galactic_brownie', name: 'Galactic Brownie Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 180, protein: 20, carbs: 17, fiber: 1, sugar: 1, fat: 5, saturatedFat: 4, sodium: 160 },
  { id: 'pure_choc_mint_cookie', name: 'Chocolate Mint Cookie Bar', brand: 'Pure Protein', category: 'Protein Bar', servingSize: 50, servingUnit: 'bar', calories: 180, protein: 19, carbs: 20, fiber: 1, sugar: 2, fat: 5, saturatedFat: 3, sodium: 100 },
  { id: 'pure_shake_rich_chocolate', name: 'Rich Chocolate Complete Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 6, fiber: 4, sugar: 0.5, fat: 2, saturatedFat: 0.5, sodium: 240 },
  { id: 'pure_shake_vanilla_milkshake', name: 'Vanilla Milkshake Complete Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 6, fiber: 4, sugar: 0.5, fat: 1.5, saturatedFat: 0, sodium: 250 },
  { id: 'pure_shake_strawberry_milkshake', name: 'Strawberry Milkshake Complete Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 6, fiber: 4, sugar: 0.5, fat: 2, saturatedFat: 0.5, sodium: 240 },
  { id: 'pure_shake_choc_peanut_butter', name: 'Chocolate Peanut Butter Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 6, fiber: 4, sugar: 0.5, fat: 1, saturatedFat: 0.5, sodium: 350 },
  { id: 'pure_shake_salted_caramel', name: 'Salted Caramel Complete Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 5, fiber: 4, sugar: 0, fat: 1, saturatedFat: 0, sodium: 340 },
  { id: 'pure_shake_banana_pudding', name: 'Banana Pudding Protein Shake', brand: 'Pure Protein', category: 'RTD Shake', servingSize: 325, servingUnit: 'bottle', calories: 140, protein: 30, carbs: 6, fiber: 3, sugar: 0.5, fat: 1.5, saturatedFat: 0.5, sodium: 250 },

  // ============================================================
  // RETAIL GROCERY — MEAT
  // ============================================================
  { id: 'kirkland_chicken_breast', name: 'Boneless Skinless Chicken Breast', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 130, protein: 28, carbs: 0, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 75 },
  { id: 'tyson_chicken_breast', name: 'Boneless Skinless Chicken Breasts', brand: 'Tyson', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 110, protein: 26, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 65 },
  { id: 'perdue_chicken_breast', name: 'Boneless Skinless Chicken Breast', brand: 'Perdue', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 120, protein: 26, carbs: 0, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 55 },
  { id: 'tyson_grilled_chicken_strips', name: 'Grilled Chicken Breast Strips', brand: 'Tyson', category: 'Meat', servingSize: 84, servingUnit: '3 oz', calories: 100, protein: 21, carbs: 1, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 490 },
  { id: 'great_value_93_lean_ground_beef', name: '93% Lean Ground Beef', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 170, protein: 24, carbs: 0, fiber: 0, sugar: 0, fat: 8, saturatedFat: 3, sodium: 75 },
  { id: 'kirkland_ground_beef_85', name: '85% Lean Ground Beef', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 240, protein: 21, carbs: 0, fiber: 0, sugar: 0, fat: 17, saturatedFat: 6.5, sodium: 75 },
  { id: 'member_mark_chicken_breast', name: 'Boneless Skinless Chicken Breast', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 120, protein: 27, carbs: 0, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 65 },
  { id: 'member_mark_93_lean_ground_beef', name: '93% Lean Ground Beef', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 170, protein: 24, carbs: 0, fiber: 0, sugar: 0, fat: 8, saturatedFat: 3, sodium: 75 },
  { id: 'great_value_extra_lean_ground_turkey', name: '99% Fat Free Ground Turkey', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 120, protein: 28, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 75 },
  { id: 'jennie_o_93_lean_ground_turkey', name: '93% Lean Ground Turkey', brand: 'Jennie-O', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 160, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 90 },
  { id: 'kirkland_salmon_fillet', name: 'Atlantic Salmon Fillet', brand: 'Kirkland Signature', category: 'Meat', servingSize: 140, servingUnit: '5 oz', calories: 280, protein: 35, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 3, sodium: 75 },
  { id: 'kirkland_turkey_breast', name: 'Oven Browned Turkey Breast', brand: 'Kirkland Signature', category: 'Meat', servingSize: 84, servingUnit: '3 oz', calories: 100, protein: 18, carbs: 2, fiber: 0, sugar: 1, fat: 2, saturatedFat: 0.5, sodium: 610 },
  { id: 'heb_chicken_breast', name: 'Boneless Skinless Chicken Breast', brand: 'H-E-B', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 120, protein: 27, carbs: 0, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 60 },

  // ============================================================
  // RETAIL GROCERY — DAIRY
  // ============================================================
  { id: 'great_value_large_eggs', name: 'Large White Eggs', brand: 'Great Value', category: 'Dairy', servingSize: 50, servingUnit: '1 egg', calories: 70, protein: 6, carbs: 0, fiber: 0, sugar: 0, fat: 5, saturatedFat: 1.5, sodium: 65 },
  { id: 'kirkland_large_eggs', name: 'Large Grade AA Eggs', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 50, servingUnit: '1 egg', calories: 70, protein: 6, carbs: 0, fiber: 0, sugar: 0, fat: 5, saturatedFat: 1.5, sodium: 65 },
  { id: 'great_value_whole_milk', name: 'Whole Milk', brand: 'Great Value', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 150, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 8, saturatedFat: 5, sodium: 125 },
  { id: 'great_value_2percent_milk', name: '2% Reduced Fat Milk', brand: 'Great Value', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 130, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 5, saturatedFat: 3, sodium: 125 },
  { id: 'fairlife_whole_milk', name: 'Ultra-Filtered Whole Milk', brand: 'Fairlife', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 150, protein: 13, carbs: 6, fiber: 0, sugar: 6, fat: 8, saturatedFat: 5, sodium: 120 },
  { id: 'fairlife_2percent_milk', name: 'Ultra-Filtered 2% Milk', brand: 'Fairlife', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 120, protein: 13, carbs: 6, fiber: 0, sugar: 6, fat: 4.5, saturatedFat: 3, sodium: 125 },
  { id: 'chobani_plain_nonfat_greek_yogurt', name: 'Plain Nonfat Greek Yogurt', brand: 'Chobani', category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 130, protein: 23, carbs: 9, fiber: 0, sugar: 7, fat: 0, saturatedFat: 0, sodium: 75 },
  { id: 'chobani_vanilla_nonfat_greek_yogurt', name: 'Vanilla Blended Nonfat Greek Yogurt', brand: 'Chobani', category: 'Dairy', servingSize: 150, servingUnit: '5.3 oz', calories: 120, protein: 15, carbs: 16, fiber: 0, sugar: 12, fat: 0, saturatedFat: 0, sodium: 65 },
  { id: 'fage_total_0_plain', name: 'Total 0% Plain Greek Yogurt', brand: 'Fage', category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 120, protein: 22, carbs: 7, fiber: 0, sugar: 7, fat: 0, saturatedFat: 0, sodium: 85 },
  { id: 'fage_total_2_plain', name: 'Total 2% Plain Greek Yogurt', brand: 'Fage', category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 150, protein: 20, carbs: 8, fiber: 0, sugar: 8, fat: 4, saturatedFat: 2.5, sodium: 85 },
  { id: 'kirkland_cottage_cheese', name: '2% Lowfat Cottage Cheese', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 113, servingUnit: '1/2 cup', calories: 90, protein: 13, carbs: 5, fiber: 0, sugar: 4, fat: 2.5, saturatedFat: 1.5, sodium: 380 },
  { id: 'great_value_shredded_cheddar', name: 'Shredded Sharp Cheddar Cheese', brand: 'Great Value', category: 'Dairy', servingSize: 28, servingUnit: '1 oz', calories: 110, protein: 7, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 5, sodium: 180 },
  { id: 'kirkland_shredded_mozzarella', name: 'Shredded Mozzarella Cheese', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 28, servingUnit: '1 oz', calories: 80, protein: 7, carbs: 1, fiber: 0, sugar: 0, fat: 5, saturatedFat: 3, sodium: 190 },
  { id: 'heb_plain_greek_yogurt', name: 'Plain Nonfat Greek Yogurt', brand: 'H-E-B', category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 120, protein: 22, carbs: 8, fiber: 0, sugar: 7, fat: 0, saturatedFat: 0, sodium: 85 },

  // ============================================================
  // RETAIL GROCERY — CANNED GOODS
  // ============================================================
  { id: 'kirkland_albacore_tuna', name: 'Albacore Solid White Tuna in Water', brand: 'Kirkland Signature', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz', calories: 70, protein: 16, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 180 },
  { id: 'starkist_chunk_light_tuna', name: 'Chunk Light Tuna in Water', brand: 'StarKist', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz', calories: 50, protein: 12, carbs: 0, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 200 },
  { id: 'great_value_canned_salmon', name: 'Wild Alaskan Pink Salmon', brand: 'Great Value', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz', calories: 60, protein: 12, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 230 },
  { id: 'great_value_black_beans', name: 'Black Beans', brand: 'Great Value', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 7, carbs: 20, fiber: 8, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 400 },
  { id: 'great_value_kidney_beans', name: 'Dark Red Kidney Beans', brand: 'Great Value', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 8, carbs: 20, fiber: 6, sugar: 1, fat: 0.5, saturatedFat: 0, sodium: 380 },
  { id: 'great_value_pinto_beans', name: 'Pinto Beans', brand: 'Great Value', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 7, carbs: 20, fiber: 6, sugar: 0, fat: 1, saturatedFat: 0, sodium: 390 },
  { id: 'del_monte_diced_tomatoes', name: 'Diced Tomatoes', brand: 'Del Monte', category: 'Canned Goods', servingSize: 121, servingUnit: '1/2 cup', calories: 25, protein: 1, carbs: 6, fiber: 1, sugar: 4, fat: 0, saturatedFat: 0, sodium: 310 },

  // ============================================================
  // RETAIL GROCERY — BEVERAGES
  // ============================================================
  { id: 'core_power_chocolate_26g', name: 'Elite Chocolate Protein Shake 26g', brand: 'Core Power', category: 'RTD Shake', servingSize: 414, servingUnit: '14 fl oz', calories: 230, protein: 26, carbs: 25, fiber: 0, sugar: 22, fat: 4.5, saturatedFat: 3, sodium: 220 },
  { id: 'core_power_vanilla_42g', name: 'Elite Vanilla Protein Shake 42g', brand: 'Core Power', category: 'RTD Shake', servingSize: 414, servingUnit: '14 fl oz', calories: 300, protein: 42, carbs: 25, fiber: 0, sugar: 22, fat: 6, saturatedFat: 3.5, sodium: 280 },
  { id: 'fairlife_core_power_chocolate', name: 'Core Power Chocolate Shake', brand: 'Fairlife', category: 'RTD Shake', servingSize: 355, servingUnit: '12 fl oz', calories: 230, protein: 26, carbs: 24, fiber: 0, sugar: 22, fat: 4.5, saturatedFat: 3, sodium: 220 },
  { id: 'oatly_oat_milk_original', name: 'Original Oat Milk', brand: 'Oatly', category: 'Beverages', servingSize: 240, servingUnit: '1 cup', calories: 120, protein: 3, carbs: 16, fiber: 2, sugar: 7, fat: 5, saturatedFat: 0.5, sodium: 100 },

  // ============================================================
  // RETAIL GROCERY — BREAD / GRAINS
  // ============================================================
  { id: 'daves_killer_21_whole_grains', name: '21 Whole Grains and Seeds Bread', brand: "Dave's Killer Bread", category: 'Bread/Grains', servingSize: 45, servingUnit: '1 slice', calories: 120, protein: 5, carbs: 22, fiber: 3, sugar: 5, fat: 2, saturatedFat: 0, sodium: 160 },
  { id: 'daves_killer_powerseed', name: 'Powerseed Bread', brand: "Dave's Killer Bread", category: 'Bread/Grains', servingSize: 45, servingUnit: '1 slice', calories: 120, protein: 5, carbs: 21, fiber: 3, sugar: 5, fat: 2.5, saturatedFat: 0, sodium: 170 },
  { id: 'natures_own_honey_wheat', name: 'Honey Wheat Bread', brand: "Nature's Own", category: 'Bread/Grains', servingSize: 26, servingUnit: '1 slice', calories: 70, protein: 3, carbs: 13, fiber: 1, sugar: 3, fat: 1, saturatedFat: 0, sodium: 120 },
  { id: 'mission_flour_tortillas', name: 'Soft Taco Flour Tortillas', brand: 'Mission', category: 'Bread/Grains', servingSize: 45, servingUnit: '1 tortilla', calories: 140, protein: 4, carbs: 24, fiber: 1, sugar: 1, fat: 3.5, saturatedFat: 1, sodium: 370 },
  { id: 'mission_corn_tortillas', name: 'White Corn Tortillas', brand: 'Mission', category: 'Bread/Grains', servingSize: 57, servingUnit: '3 tortillas', calories: 130, protein: 3, carbs: 27, fiber: 3, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 10 },
  { id: 'quaker_old_fashioned_oats', name: 'Old Fashioned Oats', brand: 'Quaker', category: 'Bread/Grains', servingSize: 40, servingUnit: '1/2 cup', calories: 150, protein: 5, carbs: 27, fiber: 4, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 0 },
  { id: 'quaker_instant_oatmeal_original', name: 'Instant Oatmeal Original', brand: 'Quaker', category: 'Bread/Grains', servingSize: 28, servingUnit: '1 packet', calories: 100, protein: 4, carbs: 19, fiber: 3, sugar: 0, fat: 2, saturatedFat: 0, sodium: 80 },
  { id: 'great_value_brown_rice', name: 'Long Grain Brown Rice', brand: 'Great Value', category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 4, carbs: 35, fiber: 2, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 0 },
  { id: 'great_value_rolled_oats', name: 'Old Fashioned Rolled Oats', brand: 'Great Value', category: 'Bread/Grains', servingSize: 40, servingUnit: '1/2 cup', calories: 150, protein: 5, carbs: 27, fiber: 4, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 0 },
  { id: 'winco_bulk_quinoa', name: 'Organic Quinoa', brand: 'WinCo Bulk', category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 6, carbs: 29, fiber: 3, sugar: 0, fat: 2.5, saturatedFat: 0, sodium: 10 },

  // ============================================================
  // RETAIL GROCERY — NUT BUTTERS
  // ============================================================
  { id: 'jif_creamy_peanut_butter', name: 'Creamy Peanut Butter', brand: 'Jif', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 8, fiber: 1, sugar: 3, fat: 16, saturatedFat: 3, sodium: 140 },
  { id: 'skippy_creamy_peanut_butter', name: 'Creamy Peanut Butter', brand: 'Skippy', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 7, fiber: 1, sugar: 3, fat: 16, saturatedFat: 3.5, sodium: 150 },
  { id: 'justins_classic_peanut_butter', name: 'Classic Peanut Butter', brand: "Justin's", category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 7, fiber: 2, sugar: 2, fat: 16, saturatedFat: 3, sodium: 90 },
  { id: 'justins_classic_almond_butter', name: 'Classic Almond Butter', brand: "Justin's", category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 200, protein: 6, carbs: 7, fiber: 2, sugar: 2, fat: 18, saturatedFat: 2, sodium: 65 },
  { id: 'kirkland_almond_butter', name: 'Creamy Almond Butter', brand: 'Kirkland Signature', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 200, protein: 7, carbs: 6, fiber: 3, sugar: 2, fat: 18, saturatedFat: 1.5, sodium: 150 },

  // ============================================================
  // RETAIL GROCERY — FROZEN MEALS
  // ============================================================
  { id: 'jimmy_dean_sausage_egg_cheese_croissant', name: 'Sausage Egg & Cheese Croissant', brand: 'Jimmy Dean', category: 'Frozen Meals', servingSize: 136, servingUnit: '1 sandwich', calories: 430, protein: 16, carbs: 27, fiber: 1, sugar: 3, fat: 28, saturatedFat: 12, sodium: 820 },
  { id: 'jimmy_dean_turkey_sausage_egg_white_muffin', name: 'Turkey Sausage Egg White & Cheese Muffin', brand: 'Jimmy Dean', category: 'Frozen Meals', servingSize: 120, servingUnit: '1 sandwich', calories: 250, protein: 18, carbs: 28, fiber: 2, sugar: 3, fat: 7, saturatedFat: 2.5, sodium: 670 },
  { id: 'jimmy_dean_turkey_sausage_crumbles', name: 'Fully Cooked Turkey Sausage Crumbles', brand: 'Jimmy Dean', category: 'Frozen Meals', servingSize: 56, servingUnit: '2 oz', calories: 80, protein: 10, carbs: 1, fiber: 0, sugar: 0, fat: 4, saturatedFat: 1, sodium: 430 },
  { id: 'kodiak_cakes_flapjack_mix', name: 'Power Cakes Flapjack & Waffle Mix', brand: 'Kodiak Cakes', category: 'Frozen Meals', servingSize: 65, servingUnit: '1/2 cup mix', calories: 240, protein: 14, carbs: 40, fiber: 3, sugar: 6, fat: 3, saturatedFat: 0.5, sodium: 440 },
  { id: 'kodiak_cakes_frozen_waffles', name: 'Buttermilk Power Waffles', brand: 'Kodiak Cakes', category: 'Frozen Meals', servingSize: 80, servingUnit: '2 waffles', calories: 220, protein: 14, carbs: 34, fiber: 2, sugar: 5, fat: 4, saturatedFat: 1, sodium: 430 },

  // ============================================================
  // RETAIL GROCERY — SNACKS / BARS
  // ============================================================
  { id: 'kind_bar_dark_choc_nuts_sea_salt', name: 'Dark Chocolate Nuts & Sea Salt Bar', brand: 'KIND', category: 'Snacks', servingSize: 40, servingUnit: '1 bar', calories: 200, protein: 6, carbs: 16, fiber: 7, sugar: 5, fat: 15, saturatedFat: 3, sodium: 125 },
  { id: 'kind_bar_almond_coconut', name: 'Almond & Coconut Bar', brand: 'KIND', category: 'Snacks', servingSize: 40, servingUnit: '1 bar', calories: 200, protein: 5, carbs: 15, fiber: 5, sugar: 7, fat: 15, saturatedFat: 5, sodium: 25 },
  { id: 'rxbar_chocolate_sea_salt', name: 'Chocolate Sea Salt Protein Bar', brand: 'RXBAR', category: 'Snacks', servingSize: 52, servingUnit: '1 bar', calories: 210, protein: 12, carbs: 24, fiber: 5, sugar: 14, fat: 8, saturatedFat: 2.5, sodium: 260 },
  { id: 'rxbar_blueberry', name: 'Blueberry Protein Bar', brand: 'RXBAR', category: 'Snacks', servingSize: 52, servingUnit: '1 bar', calories: 200, protein: 12, carbs: 24, fiber: 4, sugar: 14, fat: 7, saturatedFat: 1.5, sodium: 130 },
  { id: 'clif_bar_chocolate_chip', name: 'Chocolate Chip Energy Bar', brand: 'Clif Bar', category: 'Snacks', servingSize: 68, servingUnit: '1 bar', calories: 260, protein: 9, carbs: 44, fiber: 4, sugar: 21, fat: 6, saturatedFat: 1.5, sodium: 170 },
  { id: 'clif_builder_chocolate', name: 'Builders Chocolate Protein Bar', brand: 'Clif Bar', category: 'Snacks', servingSize: 68, servingUnit: '1 bar', calories: 270, protein: 20, carbs: 30, fiber: 1, sugar: 22, fat: 8, saturatedFat: 4, sodium: 280 },
  { id: 'nature_valley_protein_pb_dark_choc', name: 'Peanut Butter Dark Chocolate Protein Bar', brand: 'Nature Valley', category: 'Snacks', servingSize: 40, servingUnit: '1 bar', calories: 190, protein: 10, carbs: 20, fiber: 1, sugar: 12, fat: 9, saturatedFat: 3, sodium: 190 },
  { id: 'kirkland_protein_bar_choc_chip', name: 'Chocolate Chip Cookie Dough Protein Bar', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 55, servingUnit: '1 bar', calories: 190, protein: 21, carbs: 22, fiber: 2, sugar: 8, fat: 4, saturatedFat: 2, sodium: 270 },

  // ============================================================
  // GREAT VALUE — PROTEINS
  // ============================================================
  { id: 'great_value_chicken_breast', name: 'Boneless Skinless Chicken Breast', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 120, protein: 26, carbs: 0, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 60 },
  { id: 'great_value_chicken_thighs', name: 'Boneless Skinless Chicken Thighs', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 170, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 2.5, sodium: 80 },
  { id: 'great_value_ground_turkey_85', name: '85% Lean Ground Turkey', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 200, protein: 20, carbs: 0, fiber: 0, sugar: 0, fat: 13, saturatedFat: 3.5, sodium: 90 },
  { id: 'great_value_tilapia', name: 'Tilapia Fillets', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 110, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 75 },
  { id: 'great_value_chunk_light_tuna', name: 'Chunk Light Tuna in Water', brand: 'Great Value', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 50, protein: 12, carbs: 0, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 200 },
  { id: 'great_value_albacore_tuna', name: 'Solid White Albacore Tuna in Water', brand: 'Great Value', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 70, protein: 15, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 180 },
  { id: 'great_value_80_lean_ground_beef', name: '80% Lean Ground Beef', brand: 'Great Value', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 280, protein: 19, carbs: 0, fiber: 0, sugar: 0, fat: 22, saturatedFat: 8, sodium: 75 },

  // ============================================================
  // GREAT VALUE — DAIRY
  // ============================================================
  { id: 'great_value_skim_milk', name: 'Fat Free Skim Milk', brand: 'Great Value', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 90, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 0, saturatedFat: 0, sodium: 130 },
  { id: 'great_value_1percent_milk', name: '1% Low Fat Milk', brand: 'Great Value', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 110, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 2.5, saturatedFat: 1.5, sodium: 125 },
  { id: 'great_value_cottage_cheese', name: '2% Lowfat Cottage Cheese', brand: 'Great Value', category: 'Dairy', servingSize: 113, servingUnit: '1/2 cup', calories: 90, protein: 12, carbs: 5, fiber: 0, sugar: 4, fat: 2.5, saturatedFat: 1.5, sodium: 390 },
  { id: 'great_value_greek_yogurt_plain', name: 'Plain Nonfat Greek Yogurt', brand: 'Great Value', category: 'Dairy', servingSize: 150, servingUnit: '5.3 oz', calories: 80, protein: 15, carbs: 6, fiber: 0, sugar: 5, fat: 0, saturatedFat: 0, sodium: 55 },
  { id: 'great_value_butter', name: 'Unsalted Butter', brand: 'Great Value', category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 0 },
  { id: 'great_value_salted_butter', name: 'Salted Butter', brand: 'Great Value', category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 90 },
  { id: 'great_value_cream_cheese', name: 'Cream Cheese', brand: 'Great Value', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 100, protein: 2, carbs: 1, fiber: 0, sugar: 1, fat: 9, saturatedFat: 6, sodium: 90 },
  { id: 'great_value_string_cheese', name: 'Mozzarella String Cheese', brand: 'Great Value', category: 'Dairy', servingSize: 28, servingUnit: '1 stick', calories: 80, protein: 6, carbs: 0, fiber: 0, sugar: 0, fat: 6, saturatedFat: 3.5, sodium: 200 },
  { id: 'great_value_american_singles', name: 'American Cheese Singles', brand: 'Great Value', category: 'Dairy', servingSize: 21, servingUnit: '1 slice', calories: 60, protein: 3, carbs: 2, fiber: 0, sugar: 1, fat: 4.5, saturatedFat: 2.5, sodium: 250 },
  { id: 'great_value_sour_cream', name: 'Sour Cream', brand: 'Great Value', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 60, protein: 1, carbs: 2, fiber: 0, sugar: 2, fat: 5, saturatedFat: 3, sodium: 20 },

  // ============================================================
  // GREAT VALUE — CANNED GOODS
  // ============================================================
  { id: 'great_value_chicken_broth', name: 'Chicken Broth', brand: 'Great Value', category: 'Canned Goods', servingSize: 240, servingUnit: '1 cup', calories: 10, protein: 1, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 860 },
  { id: 'great_value_diced_tomatoes', name: 'Diced Tomatoes', brand: 'Great Value', category: 'Canned Goods', servingSize: 121, servingUnit: '1/2 cup', calories: 25, protein: 1, carbs: 5, fiber: 1, sugar: 3, fat: 0, saturatedFat: 0, sodium: 300 },
  { id: 'great_value_corn', name: 'Whole Kernel Sweet Corn', brand: 'Great Value', category: 'Canned Goods', servingSize: 125, servingUnit: '1/2 cup', calories: 60, protein: 2, carbs: 14, fiber: 2, sugar: 5, fat: 0.5, saturatedFat: 0, sodium: 10 },
  { id: 'great_value_green_beans', name: 'Cut Green Beans', brand: 'Great Value', category: 'Canned Goods', servingSize: 120, servingUnit: '1/2 cup', calories: 20, protein: 1, carbs: 4, fiber: 2, sugar: 1, fat: 0, saturatedFat: 0, sodium: 290 },
  { id: 'great_value_tomato_sauce', name: 'Tomato Sauce', brand: 'Great Value', category: 'Canned Goods', servingSize: 61, servingUnit: '1/4 cup', calories: 20, protein: 1, carbs: 4, fiber: 1, sugar: 2, fat: 0, saturatedFat: 0, sodium: 300 },
  { id: 'great_value_chickpeas', name: 'Garbanzo Beans (Chickpeas)', brand: 'Great Value', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 120, protein: 7, carbs: 22, fiber: 6, sugar: 1, fat: 0.5, saturatedFat: 0, sodium: 270 },
  { id: 'great_value_canned_diced_chicken', name: 'Diced Chicken Breast', brand: 'Great Value', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz', calories: 60, protein: 13, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 290 },
  { id: 'great_value_great_northern_beans', name: 'Great Northern Beans', brand: 'Great Value', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 100, protein: 7, carbs: 19, fiber: 5, sugar: 1, fat: 0.5, saturatedFat: 0, sodium: 300 },

  // ============================================================
  // GREAT VALUE — GRAINS & BREAD
  // ============================================================
  { id: 'great_value_white_rice', name: 'Long Grain Enriched White Rice', brand: 'Great Value', category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 3, carbs: 36, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 0 },
  { id: 'great_value_pasta_spaghetti', name: 'Enriched Spaghetti', brand: 'Great Value', category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },
  { id: 'great_value_pasta_penne', name: 'Penne Rigate Pasta', brand: 'Great Value', category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },
  { id: 'great_value_white_bread', name: 'Classic White Enriched Bread', brand: 'Great Value', category: 'Bread/Grains', servingSize: 26, servingUnit: '1 slice', calories: 70, protein: 2, carbs: 14, fiber: 0, sugar: 2, fat: 1, saturatedFat: 0, sodium: 130 },
  { id: 'great_value_wheat_bread', name: '100% Whole Wheat Bread', brand: 'Great Value', category: 'Bread/Grains', servingSize: 30, servingUnit: '1 slice', calories: 80, protein: 4, carbs: 13, fiber: 2, sugar: 2, fat: 1.5, saturatedFat: 0, sodium: 150 },
  { id: 'great_value_quick_oats', name: 'Quick Oats', brand: 'Great Value', category: 'Bread/Grains', servingSize: 40, servingUnit: '1/2 cup dry', calories: 150, protein: 5, carbs: 27, fiber: 4, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 0 },
  { id: 'great_value_elbow_macaroni', name: 'Enriched Elbow Macaroni', brand: 'Great Value', category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },

  // ============================================================
  // GREAT VALUE — FROZEN
  // ============================================================
  { id: 'great_value_frozen_broccoli', name: 'Frozen Broccoli Florets', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '1 cup', calories: 25, protein: 2, carbs: 5, fiber: 2, sugar: 2, fat: 0, saturatedFat: 0, sodium: 25 },
  { id: 'great_value_frozen_mixed_veg', name: 'Frozen Mixed Vegetables', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 50, protein: 2, carbs: 10, fiber: 2, sugar: 3, fat: 0, saturatedFat: 0, sodium: 55 },
  { id: 'great_value_frozen_peas', name: 'Frozen Sweet Peas', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 70, protein: 5, carbs: 13, fiber: 4, sugar: 5, fat: 0, saturatedFat: 0, sodium: 95 },
  { id: 'great_value_frozen_corn', name: 'Frozen Sweet Corn', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 80, protein: 3, carbs: 17, fiber: 2, sugar: 3, fat: 0.5, saturatedFat: 0, sodium: 10 },
  { id: 'great_value_frozen_edamame', name: 'Frozen Edamame (Shelled)', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '1/2 cup', calories: 100, protein: 9, carbs: 8, fiber: 4, sugar: 2, fat: 3.5, saturatedFat: 0, sodium: 10 },
  { id: 'great_value_frozen_green_beans', name: 'Frozen Cut Green Beans', brand: 'Great Value', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 25, protein: 1, carbs: 5, fiber: 2, sugar: 1, fat: 0, saturatedFat: 0, sodium: 0 },

  // ============================================================
  // GREAT VALUE — CONDIMENTS / OILS / OTHER
  // ============================================================
  { id: 'great_value_peanut_butter', name: 'Creamy Peanut Butter', brand: 'Great Value', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 8, fiber: 1, sugar: 3, fat: 16, saturatedFat: 3, sodium: 140 },
  { id: 'great_value_peanut_butter_natural', name: 'Natural Creamy Peanut Butter', brand: 'Great Value', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 8, carbs: 7, fiber: 2, sugar: 1, fat: 16, saturatedFat: 3, sodium: 75 },
  { id: 'great_value_mayo', name: 'Mayonnaise', brand: 'Great Value', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 90, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 10, saturatedFat: 1.5, sodium: 90 },
  { id: 'great_value_ketchup', name: 'Tomato Ketchup', brand: 'Great Value', category: 'Canned Goods', servingSize: 17, servingUnit: '1 tbsp', calories: 20, protein: 0, carbs: 5, fiber: 0, sugar: 4, fat: 0, saturatedFat: 0, sodium: 190 },
  { id: 'great_value_olive_oil', name: '100% Extra Virgin Olive Oil', brand: 'Great Value', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 120, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 2, sodium: 0 },
  { id: 'great_value_vegetable_oil', name: 'Vegetable Oil', brand: 'Great Value', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 120, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 2, sodium: 0 },
  { id: 'great_value_salsa', name: 'Mild Chunky Salsa', brand: 'Great Value', category: 'Canned Goods', servingSize: 30, servingUnit: '2 tbsp', calories: 10, protein: 0, carbs: 2, fiber: 0, sugar: 1, fat: 0, saturatedFat: 0, sodium: 230 },
  { id: 'great_value_saltines', name: 'Original Saltine Crackers', brand: 'Great Value', category: 'Snacks', servingSize: 14, servingUnit: '5 crackers', calories: 60, protein: 1, carbs: 11, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 150 },
  { id: 'great_value_dry_roasted_peanuts', name: 'Dry Roasted Peanuts Lightly Salted', brand: 'Great Value', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 170, protein: 7, carbs: 6, fiber: 2, sugar: 1, fat: 14, saturatedFat: 2, sodium: 110 },
  { id: 'great_value_granola_bar', name: 'Chewy Chocolate Chip Granola Bar', brand: 'Great Value', category: 'Snacks', servingSize: 28, servingUnit: '1 bar', calories: 100, protein: 1, carbs: 18, fiber: 1, sugar: 8, fat: 3.5, saturatedFat: 0.5, sodium: 75 },

  // ============================================================
  // KIRKLAND SIGNATURE — PROTEINS (expanding)
  // ============================================================
  { id: 'kirkland_sockeye_salmon', name: 'Wild Sockeye Salmon Fillet', brand: 'Kirkland Signature', category: 'Meat', servingSize: 140, servingUnit: '5 oz', calories: 260, protein: 37, carbs: 0, fiber: 0, sugar: 0, fat: 12, saturatedFat: 2.5, sodium: 75 },
  { id: 'kirkland_tilapia', name: 'Tilapia Fillets', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 110, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 2.5, saturatedFat: 0.5, sodium: 60 },
  { id: 'kirkland_pork_tenderloin', name: 'Pork Tenderloin', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 140, protein: 24, carbs: 0, fiber: 0, sugar: 0, fat: 4, saturatedFat: 1, sodium: 65 },
  { id: 'kirkland_ground_beef_93', name: '93% Lean Ground Beef', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 160, protein: 24, carbs: 0, fiber: 0, sugar: 0, fat: 6, saturatedFat: 2.5, sodium: 75 },
  { id: 'kirkland_frozen_chicken_breast', name: 'Frozen Boneless Skinless Chicken Breasts', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 130, protein: 28, carbs: 0, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 75 },
  { id: 'kirkland_canned_chicken', name: 'Canned White Chunk Chicken Breast', brand: 'Kirkland Signature', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 70, protein: 14, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 210 },
  { id: 'kirkland_shrimp', name: 'Cooked Tail-Off Large Shrimp', brand: 'Kirkland Signature', category: 'Meat', servingSize: 85, servingUnit: '3 oz', calories: 80, protein: 17, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 400 },
  { id: 'kirkland_chicken_thighs', name: 'Boneless Skinless Chicken Thighs', brand: 'Kirkland Signature', category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 160, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 2.5, sodium: 80 },
  { id: 'kirkland_wild_salmon_canned', name: 'Wild Alaskan Pink Salmon Canned', brand: 'Kirkland Signature', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 60, protein: 13, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 220 },

  // ============================================================
  // KIRKLAND SIGNATURE — DAIRY (expanding)
  // ============================================================
  { id: 'kirkland_whole_milk', name: 'Organic Whole Milk', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 150, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 8, saturatedFat: 5, sodium: 120 },
  { id: 'kirkland_2percent_milk', name: 'Organic 2% Reduced Fat Milk', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 130, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 5, saturatedFat: 3, sodium: 120 },
  { id: 'kirkland_butter', name: 'Unsalted Sweet Cream Butter', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 0 },
  { id: 'kirkland_salted_butter', name: 'Salted Sweet Cream Butter', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 90 },
  { id: 'kirkland_cream_cheese', name: 'Cream Cheese', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 100, protein: 2, carbs: 1, fiber: 0, sugar: 1, fat: 9, saturatedFat: 6, sodium: 80 },
  { id: 'kirkland_parmesan', name: 'Shredded Parmesan Cheese', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 10, servingUnit: '2 tbsp', calories: 40, protein: 4, carbs: 0, fiber: 0, sugar: 0, fat: 2.5, saturatedFat: 1.5, sodium: 180 },
  { id: 'kirkland_string_cheese', name: 'Mozzarella String Cheese', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 28, servingUnit: '1 stick', calories: 80, protein: 7, carbs: 0, fiber: 0, sugar: 0, fat: 5, saturatedFat: 3.5, sodium: 180 },
  { id: 'kirkland_greek_yogurt', name: 'Plain Nonfat Greek Yogurt', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 120, protein: 20, carbs: 9, fiber: 0, sugar: 9, fat: 0, saturatedFat: 0, sodium: 85 },
  { id: 'kirkland_sour_cream', name: 'Sour Cream', brand: 'Kirkland Signature', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 60, protein: 1, carbs: 2, fiber: 0, sugar: 2, fat: 5, saturatedFat: 3, sodium: 15 },

  // ============================================================
  // KIRKLAND SIGNATURE — GRAINS, BREAD & SNACKS (expanding)
  // ============================================================
  { id: 'kirkland_organic_quinoa', name: 'Organic Quinoa', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 42, servingUnit: '1/4 cup dry', calories: 160, protein: 6, carbs: 30, fiber: 3, sugar: 0, fat: 2.5, saturatedFat: 0, sodium: 0 },
  { id: 'kirkland_organic_brown_rice', name: 'Organic Long Grain Brown Rice', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 170, protein: 4, carbs: 36, fiber: 2, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 0 },
  { id: 'kirkland_multigrain_bread', name: 'Multigrain Bread', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 34, servingUnit: '1 slice', calories: 100, protein: 4, carbs: 18, fiber: 2, sugar: 2, fat: 2.5, saturatedFat: 0, sodium: 140 },
  { id: 'kirkland_bagels_plain', name: 'Plain Bagels', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 98, servingUnit: '1 bagel', calories: 270, protein: 9, carbs: 54, fiber: 2, sugar: 4, fat: 1.5, saturatedFat: 0, sodium: 480 },
  { id: 'kirkland_pasta_penne', name: 'Penne Rigate Pasta', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },
  { id: 'kirkland_frozen_broccoli', name: 'Frozen Broccoli Florets', brand: 'Kirkland Signature', category: 'Frozen Meals', servingSize: 85, servingUnit: '1 cup', calories: 30, protein: 2, carbs: 6, fiber: 3, sugar: 2, fat: 0, saturatedFat: 0, sodium: 10 },
  { id: 'kirkland_frozen_edamame', name: 'Organic Shelled Edamame', brand: 'Kirkland Signature', category: 'Frozen Meals', servingSize: 85, servingUnit: '1/2 cup', calories: 120, protein: 11, carbs: 9, fiber: 4, sugar: 2, fat: 5, saturatedFat: 0.5, sodium: 15 },
  { id: 'kirkland_mixed_nuts', name: 'Mixed Nuts (Unsalted)', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 170, protein: 5, carbs: 6, fiber: 2, sugar: 1, fat: 15, saturatedFat: 2, sodium: 95 },
  { id: 'kirkland_almonds', name: 'Whole Almonds', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 170, protein: 6, carbs: 5, fiber: 3, sugar: 1, fat: 15, saturatedFat: 1, sodium: 0 },
  { id: 'kirkland_beef_jerky', name: 'Beef Jerky', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 80, protein: 13, carbs: 4, fiber: 0, sugar: 3, fat: 1.5, saturatedFat: 0.5, sodium: 590 },
  { id: 'kirkland_trail_mix', name: 'Trail Mix', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 30, servingUnit: '1/4 cup', calories: 140, protein: 3, carbs: 19, fiber: 1, sugar: 12, fat: 6, saturatedFat: 1, sodium: 30 },
  { id: 'kirkland_granola', name: 'Granola', brand: 'Kirkland Signature', category: 'Bread/Grains', servingSize: 55, servingUnit: '1/2 cup', calories: 260, protein: 5, carbs: 39, fiber: 3, sugar: 12, fat: 10, saturatedFat: 1, sodium: 45 },
  { id: 'kirkland_olive_oil', name: 'Extra Virgin Olive Oil', brand: 'Kirkland Signature', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 120, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 2, sodium: 0 },
  { id: 'kirkland_cashews', name: 'Whole Cashews', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 160, protein: 5, carbs: 9, fiber: 1, sugar: 1, fat: 13, saturatedFat: 2.5, sodium: 95 },
  { id: 'kirkland_walnuts', name: 'Walnuts', brand: 'Kirkland Signature', category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 190, protein: 4, carbs: 4, fiber: 2, sugar: 1, fat: 18, saturatedFat: 1.5, sodium: 0 },

  // ============================================================
  // MEMBER'S MARK — PROTEINS (expanding)
  // ============================================================
  { id: 'member_mark_large_eggs', name: 'Large Grade A Eggs', brand: "Member's Mark", category: 'Dairy', servingSize: 50, servingUnit: '1 egg', calories: 70, protein: 6, carbs: 0, fiber: 0, sugar: 0, fat: 5, saturatedFat: 1.5, sodium: 65 },
  { id: 'member_mark_atlantic_salmon', name: 'Atlantic Salmon Fillet', brand: "Member's Mark", category: 'Meat', servingSize: 140, servingUnit: '5 oz', calories: 230, protein: 32, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 2.5, sodium: 65 },
  { id: 'member_mark_tilapia', name: 'Tilapia Fillets', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 110, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 2, saturatedFat: 0.5, sodium: 75 },
  { id: 'member_mark_ground_beef_80', name: '80% Lean Ground Beef', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 280, protein: 20, carbs: 0, fiber: 0, sugar: 0, fat: 22, saturatedFat: 8.5, sodium: 75 },
  { id: 'member_mark_ground_beef_85', name: '85% Lean Ground Beef', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 240, protein: 21, carbs: 0, fiber: 0, sugar: 0, fat: 17, saturatedFat: 6.5, sodium: 75 },
  { id: 'member_mark_pork_loin_chops', name: 'Boneless Pork Loin Chops', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 140, protein: 24, carbs: 0, fiber: 0, sugar: 0, fat: 4, saturatedFat: 1.5, sodium: 60 },
  { id: 'member_mark_shrimp', name: 'Large Cooked Shrimp (31-40 ct)', brand: "Member's Mark", category: 'Meat', servingSize: 85, servingUnit: '3 oz', calories: 80, protein: 17, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 390 },
  { id: 'member_mark_albacore_tuna', name: 'Solid White Albacore Tuna in Water', brand: "Member's Mark", category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 70, protein: 15, carbs: 0, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 180 },
  { id: 'member_mark_chicken_thighs', name: 'Boneless Skinless Chicken Thighs', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 160, protein: 21, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 2.5, sodium: 80 },
  { id: 'member_mark_ground_turkey_93', name: '93% Lean Ground Turkey', brand: "Member's Mark", category: 'Meat', servingSize: 112, servingUnit: '4 oz', calories: 160, protein: 22, carbs: 0, fiber: 0, sugar: 0, fat: 8, saturatedFat: 2, sodium: 90 },
  { id: 'member_mark_salmon_canned', name: 'Wild Alaskan Pink Salmon Canned', brand: "Member's Mark", category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 60, protein: 12, carbs: 0, fiber: 0, sugar: 0, fat: 1, saturatedFat: 0, sodium: 230 },

  // ============================================================
  // MEMBER'S MARK — DAIRY & GRAINS
  // ============================================================
  { id: 'member_mark_whole_milk', name: 'Whole Milk', brand: "Member's Mark", category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 150, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 8, saturatedFat: 5, sodium: 125 },
  { id: 'member_mark_2percent_milk', name: '2% Reduced Fat Milk', brand: "Member's Mark", category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 130, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 5, saturatedFat: 3, sodium: 125 },
  { id: 'member_mark_skim_milk', name: 'Fat Free Skim Milk', brand: "Member's Mark", category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 90, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 0, saturatedFat: 0, sodium: 130 },
  { id: 'member_mark_greek_yogurt', name: 'Plain Nonfat Greek Yogurt', brand: "Member's Mark", category: 'Dairy', servingSize: 227, servingUnit: '8 oz', calories: 120, protein: 22, carbs: 8, fiber: 0, sugar: 7, fat: 0, saturatedFat: 0, sodium: 80 },
  { id: 'member_mark_cottage_cheese', name: '2% Lowfat Cottage Cheese', brand: "Member's Mark", category: 'Dairy', servingSize: 113, servingUnit: '1/2 cup', calories: 90, protein: 12, carbs: 5, fiber: 0, sugar: 4, fat: 2.5, saturatedFat: 1.5, sodium: 380 },
  { id: 'member_mark_shredded_cheddar', name: 'Shredded Mild Cheddar Cheese', brand: "Member's Mark", category: 'Dairy', servingSize: 28, servingUnit: '1 oz', calories: 110, protein: 7, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 5, sodium: 180 },
  { id: 'member_mark_butter', name: 'Salted Butter', brand: "Member's Mark", category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 90 },
  { id: 'member_mark_old_fashioned_oats', name: 'Old Fashioned Oats', brand: "Member's Mark", category: 'Bread/Grains', servingSize: 40, servingUnit: '1/2 cup dry', calories: 150, protein: 5, carbs: 27, fiber: 4, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 0 },
  { id: 'member_mark_white_rice', name: 'Long Grain White Rice', brand: "Member's Mark", category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 3, carbs: 36, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 0 },
  { id: 'member_mark_brown_rice', name: 'Long Grain Brown Rice', brand: "Member's Mark", category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 4, carbs: 35, fiber: 2, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 0 },
  { id: 'member_mark_pasta', name: 'Enriched Spaghetti', brand: "Member's Mark", category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },
  { id: 'member_mark_peanut_butter', name: 'Creamy Peanut Butter', brand: "Member's Mark", category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 8, fiber: 2, sugar: 2, fat: 16, saturatedFat: 3, sodium: 140 },
  { id: 'member_mark_olive_oil', name: 'Extra Virgin Olive Oil', brand: "Member's Mark", category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 120, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 2, sodium: 0 },
  { id: 'member_mark_mixed_nuts', name: 'Deluxe Mixed Nuts Lightly Salted', brand: "Member's Mark", category: 'Snacks', servingSize: 28, servingUnit: '1 oz', calories: 170, protein: 5, carbs: 7, fiber: 2, sugar: 1, fat: 15, saturatedFat: 2, sodium: 85 },
  { id: 'member_mark_black_beans', name: 'Black Beans', brand: "Member's Mark", category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 7, carbs: 20, fiber: 7, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 400 },
  { id: 'member_mark_frozen_broccoli', name: 'Frozen Broccoli Florets', brand: "Member's Mark", category: 'Frozen Meals', servingSize: 85, servingUnit: '1 cup', calories: 30, protein: 2, carbs: 6, fiber: 2, sugar: 2, fat: 0, saturatedFat: 0, sodium: 10 },

  // ============================================================
  // FOOD CLUB — PROTEINS & DAIRY
  // ============================================================
  { id: 'food_club_large_eggs', name: 'Large Grade A Eggs', brand: 'Food Club', category: 'Dairy', servingSize: 50, servingUnit: '1 egg', calories: 70, protein: 6, carbs: 0, fiber: 0, sugar: 0, fat: 5, saturatedFat: 1.5, sodium: 65 },
  { id: 'food_club_whole_milk', name: 'Whole Milk', brand: 'Food Club', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 150, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 8, saturatedFat: 5, sodium: 125 },
  { id: 'food_club_2percent_milk', name: '2% Reduced Fat Milk', brand: 'Food Club', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 130, protein: 8, carbs: 12, fiber: 0, sugar: 12, fat: 5, saturatedFat: 3, sodium: 125 },
  { id: 'food_club_1percent_milk', name: '1% Low Fat Milk', brand: 'Food Club', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 110, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 2.5, saturatedFat: 1.5, sodium: 125 },
  { id: 'food_club_skim_milk', name: 'Fat Free Skim Milk', brand: 'Food Club', category: 'Dairy', servingSize: 240, servingUnit: '1 cup', calories: 90, protein: 8, carbs: 13, fiber: 0, sugar: 12, fat: 0, saturatedFat: 0, sodium: 130 },
  { id: 'food_club_butter', name: 'Salted Butter', brand: 'Food Club', category: 'Dairy', servingSize: 14, servingUnit: '1 tbsp', calories: 100, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 11, saturatedFat: 7, sodium: 90 },
  { id: 'food_club_shredded_cheddar', name: 'Shredded Medium Cheddar Cheese', brand: 'Food Club', category: 'Dairy', servingSize: 28, servingUnit: '1 oz', calories: 110, protein: 7, carbs: 0, fiber: 0, sugar: 0, fat: 9, saturatedFat: 5, sodium: 185 },
  { id: 'food_club_cream_cheese', name: 'Cream Cheese', brand: 'Food Club', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 100, protein: 2, carbs: 2, fiber: 0, sugar: 1, fat: 9, saturatedFat: 6, sodium: 110 },
  { id: 'food_club_cottage_cheese', name: '2% Lowfat Cottage Cheese', brand: 'Food Club', category: 'Dairy', servingSize: 113, servingUnit: '1/2 cup', calories: 90, protein: 12, carbs: 5, fiber: 0, sugar: 4, fat: 2.5, saturatedFat: 1.5, sodium: 380 },
  { id: 'food_club_sour_cream', name: 'Sour Cream', brand: 'Food Club', category: 'Dairy', servingSize: 30, servingUnit: '2 tbsp', calories: 60, protein: 1, carbs: 2, fiber: 0, sugar: 2, fat: 5, saturatedFat: 3.5, sodium: 20 },
  { id: 'food_club_american_singles', name: 'American Cheese Singles', brand: 'Food Club', category: 'Dairy', servingSize: 21, servingUnit: '1 slice', calories: 60, protein: 3, carbs: 2, fiber: 0, sugar: 1, fat: 4.5, saturatedFat: 2.5, sodium: 250 },
  { id: 'food_club_chunk_light_tuna', name: 'Chunk Light Tuna in Water', brand: 'Food Club', category: 'Canned Goods', servingSize: 56, servingUnit: '2 oz drained', calories: 50, protein: 11, carbs: 0, fiber: 0, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 190 },

  // ============================================================
  // FOOD CLUB — CANNED GOODS
  // ============================================================
  { id: 'food_club_black_beans', name: 'Black Beans', brand: 'Food Club', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 7, carbs: 19, fiber: 7, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 390 },
  { id: 'food_club_kidney_beans', name: 'Dark Red Kidney Beans', brand: 'Food Club', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 8, carbs: 20, fiber: 6, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 370 },
  { id: 'food_club_pinto_beans', name: 'Pinto Beans', brand: 'Food Club', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 110, protein: 7, carbs: 20, fiber: 6, sugar: 0, fat: 0.5, saturatedFat: 0, sodium: 380 },
  { id: 'food_club_diced_tomatoes', name: 'Diced Tomatoes', brand: 'Food Club', category: 'Canned Goods', servingSize: 121, servingUnit: '1/2 cup', calories: 25, protein: 1, carbs: 5, fiber: 1, sugar: 3, fat: 0, saturatedFat: 0, sodium: 300 },
  { id: 'food_club_corn', name: 'Whole Kernel Sweet Corn', brand: 'Food Club', category: 'Canned Goods', servingSize: 125, servingUnit: '1/2 cup', calories: 60, protein: 2, carbs: 14, fiber: 2, sugar: 5, fat: 0.5, saturatedFat: 0, sodium: 10 },
  { id: 'food_club_green_beans', name: 'Cut Green Beans', brand: 'Food Club', category: 'Canned Goods', servingSize: 120, servingUnit: '1/2 cup', calories: 20, protein: 1, carbs: 4, fiber: 2, sugar: 1, fat: 0, saturatedFat: 0, sodium: 290 },
  { id: 'food_club_chicken_broth', name: 'Chicken Broth', brand: 'Food Club', category: 'Canned Goods', servingSize: 240, servingUnit: '1 cup', calories: 15, protein: 1, carbs: 1, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 870 },
  { id: 'food_club_tomato_sauce', name: 'Tomato Sauce', brand: 'Food Club', category: 'Canned Goods', servingSize: 61, servingUnit: '1/4 cup', calories: 20, protein: 1, carbs: 4, fiber: 1, sugar: 2, fat: 0, saturatedFat: 0, sodium: 280 },
  { id: 'food_club_chickpeas', name: 'Garbanzo Beans (Chickpeas)', brand: 'Food Club', category: 'Canned Goods', servingSize: 130, servingUnit: '1/2 cup', calories: 120, protein: 7, carbs: 22, fiber: 6, sugar: 1, fat: 0.5, saturatedFat: 0, sodium: 270 },

  // ============================================================
  // FOOD CLUB — GRAINS, BREAD & CONDIMENTS
  // ============================================================
  { id: 'food_club_white_bread', name: 'Enriched White Bread', brand: 'Food Club', category: 'Bread/Grains', servingSize: 26, servingUnit: '1 slice', calories: 70, protein: 2, carbs: 14, fiber: 0, sugar: 2, fat: 1, saturatedFat: 0, sodium: 130 },
  { id: 'food_club_wheat_bread', name: 'Whole Wheat Bread', brand: 'Food Club', category: 'Bread/Grains', servingSize: 30, servingUnit: '1 slice', calories: 80, protein: 3, carbs: 14, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 140 },
  { id: 'food_club_white_rice', name: 'Long Grain White Rice', brand: 'Food Club', category: 'Bread/Grains', servingSize: 45, servingUnit: '1/4 cup dry', calories: 160, protein: 3, carbs: 36, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 0 },
  { id: 'food_club_old_fashioned_oats', name: 'Old Fashioned Oats', brand: 'Food Club', category: 'Bread/Grains', servingSize: 40, servingUnit: '1/2 cup dry', calories: 150, protein: 5, carbs: 27, fiber: 4, sugar: 1, fat: 3, saturatedFat: 0.5, sodium: 0 },
  { id: 'food_club_pasta_elbow', name: 'Enriched Elbow Macaroni', brand: 'Food Club', category: 'Bread/Grains', servingSize: 56, servingUnit: '2 oz dry', calories: 200, protein: 7, carbs: 41, fiber: 2, sugar: 2, fat: 1, saturatedFat: 0, sodium: 0 },
  { id: 'food_club_peanut_butter', name: 'Creamy Peanut Butter', brand: 'Food Club', category: 'Nut Butters', servingSize: 32, servingUnit: '2 tbsp', calories: 190, protein: 7, carbs: 7, fiber: 1, sugar: 3, fat: 17, saturatedFat: 3, sodium: 150 },
  { id: 'food_club_mayo', name: 'Mayonnaise', brand: 'Food Club', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 90, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 10, saturatedFat: 1.5, sodium: 85 },
  { id: 'food_club_ketchup', name: 'Tomato Ketchup', brand: 'Food Club', category: 'Canned Goods', servingSize: 17, servingUnit: '1 tbsp', calories: 20, protein: 0, carbs: 5, fiber: 0, sugar: 4, fat: 0, saturatedFat: 0, sodium: 190 },
  { id: 'food_club_mustard', name: 'Yellow Mustard', brand: 'Food Club', category: 'Canned Goods', servingSize: 5, servingUnit: '1 tsp', calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, saturatedFat: 0, sodium: 50 },
  { id: 'food_club_vegetable_oil', name: 'Vegetable Oil', brand: 'Food Club', category: 'Canned Goods', servingSize: 14, servingUnit: '1 tbsp', calories: 120, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 14, saturatedFat: 2, sodium: 0 },
  { id: 'food_club_saltines', name: 'Original Saltine Crackers', brand: 'Food Club', category: 'Snacks', servingSize: 14, servingUnit: '5 crackers', calories: 60, protein: 1, carbs: 11, fiber: 0, sugar: 0, fat: 1.5, saturatedFat: 0, sodium: 150 },

  // ============================================================
  // FOOD CLUB — FROZEN
  // ============================================================
  { id: 'food_club_frozen_broccoli', name: 'Frozen Broccoli Florets', brand: 'Food Club', category: 'Frozen Meals', servingSize: 85, servingUnit: '1 cup', calories: 25, protein: 2, carbs: 5, fiber: 2, sugar: 2, fat: 0, saturatedFat: 0, sodium: 20 },
  { id: 'food_club_frozen_peas', name: 'Frozen Sweet Peas', brand: 'Food Club', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 70, protein: 5, carbs: 13, fiber: 4, sugar: 5, fat: 0, saturatedFat: 0, sodium: 95 },
  { id: 'food_club_frozen_corn', name: 'Frozen Sweet Corn', brand: 'Food Club', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 80, protein: 2, carbs: 17, fiber: 2, sugar: 3, fat: 0.5, saturatedFat: 0, sodium: 10 },
  { id: 'food_club_frozen_mixed_veg', name: 'Frozen Mixed Vegetables', brand: 'Food Club', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 50, protein: 2, carbs: 10, fiber: 2, sugar: 3, fat: 0, saturatedFat: 0, sodium: 50 },
  { id: 'food_club_frozen_green_beans', name: 'Frozen Cut Green Beans', brand: 'Food Club', category: 'Frozen Meals', servingSize: 85, servingUnit: '2/3 cup', calories: 25, protein: 1, carbs: 5, fiber: 2, sugar: 1, fat: 0, saturatedFat: 0, sodium: 0 },

  // ============================================================
  // GROCERY STAPLES (USDA-accurate)
  // ============================================================
  ...FOODS_GROCERY,

  // ============================================================
  // GROCERY EXPANSION — Canned · More Produce · Low-Carb · Low-Fat · Sugar-Free
  // ============================================================
  ...FOODS_GROCERY2,

  // ============================================================
  // GROCERY EXPANSION 3 — Frozen · Plant-Based · Bars/Shakes · Dressings
  // Dips · Snacks · Dried Fruit · Dairy · Breakfast · International · Pasta
  // ============================================================
  ...FOODS_GROCERY3,

  // ============================================================
  // RESTAURANT ITEMS — Original (McDonald's · Chick-fil-A · Chipotle · Costa Vida
  //   Taco Bell · Wendy's · Panda Express · Subway · Starbucks · Popeyes
  //   Shake Shack · Panera · Olive Garden · Jack in the Box · Five Guys
  //   Burger King · Wingstop · Sonic · Pizza Hut · IHOP)
  // ============================================================
  ...FOODS_RESTAURANT,

  // ============================================================
  // RESTAURANT ITEMS — Batch 2 (KFC · Arby's · Dairy Queen · Whataburger
  //   In-N-Out · Raising Cane's · Carl's Jr. · Del Taco · El Pollo Loco)
  // ============================================================
  ...FOODS_RESTAURANT2,

  // ============================================================
  // RESTAURANT ITEMS — Batch 3 (Domino's · Papa John's · Little Caesars
  //   Bojangles · Church's Chicken · Checkers/Rally's · Slim Chickens · Wawa)
  // ============================================================
  ...FOODS_RESTAURANT3,

  // ============================================================
  // RESTAURANT ITEMS — Batch 4 (Jersey Mike's · Jimmy John's · Firehouse Subs
  //   Potbelly · Moe's · Qdoba · Jason's Deli · McAlister's Deli)
  // ============================================================
  ...FOODS_RESTAURANT4,

  // ============================================================
  // RESTAURANT ITEMS — Batch 5 (Chili's · Applebee's · Buffalo Wild Wings
  //   Denny's · Texas Roadhouse · Outback · TGI Friday's · Red Robin)
  // ============================================================
  ...FOODS_RESTAURANT5,

  // ============================================================
  // RESTAURANT ITEMS — Batch 6 (Dunkin' · Dutch Bros · Einstein Bros
  //   Smoothie King · Jamba · Tropical Smoothie · Sweetgreen · Cava
  //   Noodles & Company)
  // ============================================================
  ...FOODS_RESTAURANT6,

  // ============================================================
  // GROCERY BRANDS — Batch 4 (Trader Joe's · Good & Gather · Boar's Head
  //   Applegate · Tillamook · Wild Planet · Kodiak · Magic Spoon · Siggi's
  //   Noosa · Chomps · EPIC · Wilde · Hippeas · Banza)
  // ============================================================
  ...FOODS_GROCERY4,

  // ============================================================
  // SUPPLEMENT BRANDS — Batch 2 (Ghost · Transparent Labs · Legion · 1st Phorm
  //   Rule 1 · BSN · MusclePharm · MuscleTech · Kaged · Redcon1 · Ascent
  //   Muscle Milk RTD · Orgain RTD · OWYN · Slate Milk)
  // ============================================================
  ...FOODS_SUPPLEMENTS2,

  // ============================================================
  // PROTEIN BARS — Batch 2 (Clif Builder's · KIND Protein · Perfect Bar
  //   GoMacro · No Cow · Grenade · thinkThin · ALOHA · Vega · Munk Pack
  //   Detour · Power Crunch · Atlas · Rise · IQ Bar · Combat Crunch)
  // ============================================================
  ...FOODS_BARS2,
]

/** Total number of foods in the database — used by Landing page stats. */
export const FOOD_COUNT = FOODS.length

export const CATEGORIES = [
  'All',
  // Supplements / protein products
  'Protein Bar',
  'RTD Shake',
  'Whey Protein',
  'Casein Protein',
  'Mass Gainer',
  'Protein Chip',
  'Protein Cookie',
  'Protein Donut',
  'Pre-Workout',
  // Whole foods
  'Meat & Fish',
  'Eggs & Dairy',
  'Fruits',
  'Vegetables',
  'Legumes',
  'Rice & Pasta',
  'Bread & Grains',
  'Cereals & Oats',
  'Nut Butters',
  'Nuts & Seeds',
  'Oils & Fats',
  'Condiments & Sauces',
  // Packaged / convenience
  'Canned Goods',
  'Frozen Meals',
  'Snacks',
  'Beverages',
  // Restaurant
  'Restaurant',
  // Catch-all
  'Other',
]

export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout']
