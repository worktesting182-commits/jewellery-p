import React from "react";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = "Select an option",
  required = false,
  icon: Icon,
  disabled = false,
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-xs font-black tracking-wider text-black uppercase">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#A68868] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none rounded-full bg-white border text-xs font-extrabold text-black transition-all outline-none py-2.5 ${
            Icon ? "pl-10" : "pl-4"
          } pr-10 ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              : "border-[#CDD5DB] hover:border-[#A68868] focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <option value="" disabled className="bg-white text-black/50">
            {placeholder}
          </option>
          {options.map((opt, idx) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            return (
              <option key={val ?? idx} value={val} className="bg-white text-black py-2">
                {lbl}
              </option>
            );
          })}
        </select>

        {/* Custom Chevron Arrow */}
        <div className="absolute right-3.5 pointer-events-none text-[#A68868]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-0.5 animate-fadeIn">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
