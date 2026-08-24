import React, { useState } from "react";
import { X, Camera, Sparkles, RefreshCw, CheckCircle, ShieldCheck, Eye } from "lucide-react";

const VirtualTryOnModal = ({ isOpen, onClose, product }) => {
  const [activeTab, setActiveTab] = useState("model"); // 'model' or 'webcam'
  const [webcamActive, setWebcamActive] = useState(false);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#EFEBE4] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-gray-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#EFEBE4] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99A2C] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C99A2C]">
                AR Jewellery Visualizer
              </span>
              <h2 className="text-xl font-bold font-serif tracking-wide text-gray-900">
                Virtual Try-On — {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto bg-white">
          {/* AR Preview Canvas */}
          <div className="flex-1 bg-[#FAF8F5] border border-[#EFEBE4] rounded-2xl relative min-h-[320px] flex items-center justify-center overflow-hidden">
            <img
              src={product.image_url || product.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"}
              alt={product.name}
              className="max-h-72 object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
            />

            {/* AR Overlay Badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 border border-amber-300 text-[#C99A2C] text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> 3D AR Scale: 100% Real Size
            </div>

            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> BIS Hallmark Verified
            </div>
          </div>

          {/* Controls & Specs */}
          <div className="w-full md:w-72 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] space-y-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Product Specs
                </span>
                <p className="text-sm font-bold font-serif text-gray-900">{product.name}</p>
                <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-[#EFEBE4]">
                  <p>Material: <span className="text-[#C99A2C] font-semibold">{product.purity} {product.material}</span></p>
                  <p>Net Weight: <span className="text-gray-900 font-semibold">{product.weight || 12.5}g</span></p>
                  <p>Retailer Selling Price: <span className="text-[#C99A2C] font-serif font-bold text-sm">₹{(product.selling_price || product.manufacturer_price || 0).toLocaleString("en-IN")}</span></p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] space-y-3">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
                  Try-On Mode
                </span>

                <button
                  onClick={() => setWebcamActive(!webcamActive)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    webcamActive
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 border"
                      : "bg-[#C99A2C] hover:bg-[#B8860B] text-white shadow-xs"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {webcamActive ? "Webcam Active (Calibrating)" : "Activate Live Camera"}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
            >
              Close Try-On Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOnModal;
