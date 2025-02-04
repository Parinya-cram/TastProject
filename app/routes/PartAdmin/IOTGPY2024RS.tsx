import { useState } from 'react';

interface DeviceProps {
  pmId: string;
}

const IOTGPY2024RS = ({ pmId }: DeviceProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestart = async () => {
    setLoading(true);
    setError(null);

    try {
      // Change URL to match the ESP8266's IP address
      const response = await fetch("http://172.20.10.8/restart", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to restart ESP8266");
      }

      alert("ESP8266 restarted successfully!");
    } catch (err) {
      setError("Failed to restart ESP8266: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only show restart button if the pmId is "IOTGPY2024"
  if (pmId !== "IOTGPY2024") {
    return null; // Don't render anything if pmId is not "IOTGPY2024"
  }

  return (
    <div>
      {/* Restart Button */}
      <button
        onClick={handleRestart}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white font-semibold ${
          loading ? "bg-gray-500" : error ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {loading ? "Restarting..." : "Restart IOTGPY2024"}
      </button>
    </div>
  );
};

export default IOTGPY2024RS;
