import React from "react";

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  rows = 4,
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-xs font-black tracking-wider text-black uppercase">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>

      <textarea
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-3xl bg-white border text-xs font-extrabold text-black placeholder-black/40 transition-all outline-none p-4 resize-y ${
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            : "border-[#CDD5DB] hover:border-[#A68868] focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868]"
        }`}
      />

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
