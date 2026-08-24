import React from "react";

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  step,
  min,
  max,
  prefix,
  suffix,
  icon: Icon,
  helperText,
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-xs font-black tracking-wider text-black uppercase flex items-center justify-between">
        <span>
          {label} {required && <span className="text-rose-600">*</span>}
        </span>
        {helperText && <span className="text-[10px] normal-case text-black/60 font-bold">{helperText}</span>}
      </label>

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#A68868] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {prefix && (
          <span className="absolute left-3.5 text-xs text-[#A68868] font-black pointer-events-none">
            {prefix}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          className={`w-full rounded-full bg-white border text-xs font-extrabold text-black placeholder-black/40 transition-all outline-none py-2.5 ${
            Icon ? "pl-10" : prefix ? "pl-8" : "pl-4"
          } ${suffix ? "pr-12" : "pr-4"} ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              : "border-[#CDD5DB] hover:border-[#A68868] focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868]"
          }`}
        />

        {suffix && (
          <span className="absolute right-3.5 text-xs text-black/60 font-black pointer-events-none">
            {suffix}
          </span>
        )}
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
