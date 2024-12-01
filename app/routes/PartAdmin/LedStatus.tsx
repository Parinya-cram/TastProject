import React from 'react';

interface LedStatusProps {
  lastUpdate: string | null; // Timestamp of the last update from Firestore
  PM1: number | null;       // PM1 value from IoT data
  PM10: number | null;      // PM10 value from IoT data
  PM2_5: number | null;     // PM2.5 value from IoT data
}

const LedStatus: React.FC<LedStatusProps> = ({ lastUpdate, PM1, PM10, PM2_5 }) => {
  // คำนวณสถานะไฟ
  const getLedStatusColor = () => {
    // Array of PM values to check for changes
    const pmValues = [PM1, PM10, PM2_5];
    // Check if any of the PM values have been updated (i.e., are not null or undefined)
    const isAnyPMUpdated = pmValues.some((pm) => pm !== null && pm !== undefined);

    if (lastUpdate) {
      // แปลง lastUpdate เป็น Date object
      const lastUpdateTime = new Date(lastUpdate); // Last update time from Firestore
      const currentTime = new Date(); // Current time
      const timeDifference = (currentTime.getTime() - lastUpdateTime.getTime()) / 1000; // Difference in seconds

      // Check for PM value movement and if it was updated recently
      if (isAnyPMUpdated && timeDifference <= 30) {
        return 'bg-green-500'; // Green (Online): PM values have changed and it's within 30 seconds
      } else if (!isAnyPMUpdated || timeDifference > 30) {
        return 'bg-red-500'; // Red (Offline): Either no PM values or no change in 30 seconds
      }
    }

    // Default to red if lastUpdate is null or no movement in PM values
    return 'bg-red-500'; // Red (Offline) if no update
  };

  const indicatorColor = getLedStatusColor();

  return (
    <div className={`w-6 h-6 rounded-full ${indicatorColor}`} />
  );
};

export default LedStatus;
