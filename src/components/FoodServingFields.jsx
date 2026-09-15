import { useId } from 'react'
import { validServingSize } from '../lib/foodFormValidation'
import './FoodForm.css'

const units = ['g', 'oz', 'ml', 'fl oz', 'bar', 'scoop', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'packet', 'bottle', 'can', 'bag']

export default function FoodServingFields({ size, unit, onSizeChange, onUnitChange }) {
  const id = useId()
  const invalid = size !== '' && !validServingSize(size)
  return <fieldset className="food-serving-card">
    <legend>Serving size</legend>
    <div className="food-serving-grid">
      <div>
        <label htmlFor={`${id}-amount`}>Amount</label>
        <input id={`${id}-amount`} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
          placeholder="100" value={size} onChange={onSizeChange}
          aria-invalid={invalid} aria-describedby={`${id}-hint`} />
      </div>
      <div>
        <label htmlFor={`${id}-unit`}>Unit</label>
        <select id={`${id}-unit`} value={unit} onChange={onUnitChange}>
          {units.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
    </div>
    <p id={`${id}-hint`} className={invalid ? 'food-serving-error' : ''} role={invalid ? 'alert' : undefined}>
      {invalid ? 'Enter an amount greater than 0 and no more than 10,000. Use a decimal, such as 33.5.' : 'Enter the serving amount from the label. Nutrition below is for this serving.'}
    </p>
  </fieldset>
}
