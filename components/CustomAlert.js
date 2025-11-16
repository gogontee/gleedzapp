import { motion } from "framer-motion";
import { Award, X } from "lucide-react";

export default function CustomAlert({ isOpen, onClose, title, message, type = "info", onConfirm, confirmText = "Proceed", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <Award className="w-12 h-12 text-yellow-500" />;
      case "success":
        return <Award className="w-12 h-12 text-green-500" />;
      case "error":
        return <X className="w-12 h-12 text-red-500" />;
      default:
        return <Award className="w-12 h-12 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm text-white font-semibold rounded-lg transition-all duration-300 ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}