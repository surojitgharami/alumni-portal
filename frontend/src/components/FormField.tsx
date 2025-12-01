import { ReactNode } from 'react'
import { Info } from 'lucide-react'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  error?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  tooltip?: string
  options?: { value: string; label: string }[]
  textarea?: boolean
  rows?: number
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  tooltip,
  options,
  textarea = false,
  rows = 3
}: FormFieldProps) {
  const inputClasses = disabled ? 'input-disabled' : 'input'

  const renderInput = (): ReactNode => {
    if (options) {
      return (
        <select
          name={name}
          id={name}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
          disabled={disabled}
          required={required}
          className={inputClasses}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (textarea) {
      return (
        <textarea
          name={name}
          id={name}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
        />
      )
    }

    return (
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={inputClasses}
      />
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
        {tooltip && (
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      {renderInput()}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default FormField
