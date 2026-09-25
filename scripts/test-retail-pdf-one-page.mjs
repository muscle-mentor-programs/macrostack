import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { generateRetailPlanPDF } from '../src/retail/planPDF.js';

const brand = {
  name:'MacroStack Retail',
  font:readFileSync('public/fonts/SpaceGrotesk.ttf').toString('base64'),
  headingFont:readFileSync('public/fonts/BarlowCondensed-Black.ttf').toString('base64'),
};
const food = (name, calories, protein, carbs, fat) => ({name, quantity:1, servingUnit:'serving', calories, protein, carbs, fat});
const day = index => ({
  label:`Day ${index + 1}`,
  meals:{
    Breakfast:[food('Egg white and mozzarella breakfast sandwich', 356, 31, 28, 9)],
    Lunch:[food('Chipotle chicken avocado melt', 690, 42, 63, 28)],
    Dinner:[food('Grilled chicken, brown rice, and roasted vegetables', 623, 51, 59, 15)],
    Snack:[food('Whole almonds', 170, 6, 5, 15), food('Creamy chocolate whey protein', 130, 25, 4, 2)],
  },
});

for (const count of [1, 3, 14]) {
  const pdf = generateRetailPlanPDF(
    {planName:'Personalized Nutrition Plan', days:Array.from({length:count}, (_, index) => day(index))},
    {name:'Sample Customer', goals:{calories:2000, protein:155, carbs:220, fat:65}}, brand,
  );
  assert.equal(pdf.getNumberOfPages(), 1, `${count}-day plan should fit one page`);
  assert.deepEqual(pdf.internal.pageSize.getWidth(), 612);
  assert.deepEqual(pdf.internal.pageSize.getHeight(), 792);
  if (count === 1 && process.env.RETAIL_PDF_SAMPLE) writeFileSync(process.env.RETAIL_PDF_SAMPLE, Buffer.from(pdf.output('arraybuffer')));
  if (count === 14 && process.env.RETAIL_PDF_DENSE_SAMPLE) writeFileSync(process.env.RETAIL_PDF_DENSE_SAMPLE, Buffer.from(pdf.output('arraybuffer')));
}
const denseDay = day(0);
for (const meal of Object.keys(denseDay.meals)) {
  denseDay.meals[meal] = Array.from({length:5}, (_, index) =>
    food(`${meal} option ${index + 1}: grilled chicken, vegetables, and rice`, 420, 38, 44, 11));
}
const densePdf = generateRetailPlanPDF(
  {planName:'Personalized Nutrition Plan', days:[denseDay]},
  {name:'Sample Customer', goals:{calories:2000, protein:155, carbs:220, fat:65}}, brand,
);
assert.equal(densePdf.getNumberOfPages(), 1, 'dense single-day plan should fit one page');
if (process.env.RETAIL_PDF_TWO_COLUMN_SAMPLE) writeFileSync(process.env.RETAIL_PDF_TWO_COLUMN_SAMPLE, Buffer.from(densePdf.output('arraybuffer')));
const singleMealPdf = generateRetailPlanPDF(
  {planName:'Single Meal Plan', days:[{label:'Day 1', meals:{Lunch:Array.from({length:20}, (_, index) =>
    food(`Lunch option ${index + 1}: grilled chicken, vegetables, and rice`, 420, 38, 44, 11))}}]},
  {name:'Sample Customer'}, brand,
);
assert.equal(singleMealPdf.getNumberOfPages(), 1, 'a long individual meal should fit one page');
if (process.env.RETAIL_PDF_SINGLE_MEAL_SAMPLE) writeFileSync(process.env.RETAIL_PDF_SINGLE_MEAL_SAMPLE, Buffer.from(singleMealPdf.output('arraybuffer')));
console.log('Retail meal plan PDF fits one portrait Letter page for short and dense plans.');
