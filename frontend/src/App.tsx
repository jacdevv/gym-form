import { useState } from "react";
import { WorkoutDashboard } from "@/components/common/WorkoutDashboard";
import { WorkoutSelector } from "@/components/common/WorkoutSelector";
import { WorkoutType } from "@/types/workouts";
import { getWorkoutConfig } from "@/config/workouts";
import { squatAnalyzer } from "@/utils/workoutAnalyzers/squatAnalyzer";
import { pushupAnalyzer } from "@/utils/workoutAnalyzers/pushupAnalyzer";
import { deadliftAnalyzer } from "@/utils/workoutAnalyzers/deadliftAnalyzer";
import { bicepCurlAnalyzer } from "@/utils/workoutAnalyzers/bicepCurlAnalyzer";

function App() {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutType>('squat');
  
  const workoutConfig = getWorkoutConfig(currentWorkout);
  
  const getAnalyzer = (workoutType: WorkoutType) => {
    switch (workoutType) {
      case 'squat':
        return squatAnalyzer;
      case 'pushup':
        return pushupAnalyzer;
      case 'deadlift':
        return deadliftAnalyzer;
      case 'bicep-curl':
        return bicepCurlAnalyzer;
      default:
        return squatAnalyzer;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Gym Form Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time workout analysis using computer vision
          </p>
        </header>
        
        <div className="space-y-6">
          <WorkoutSelector
            currentWorkout={currentWorkout}
            onWorkoutChange={setCurrentWorkout}
          />
          
          <WorkoutDashboard
            workoutType={currentWorkout}
            analyzer={getAnalyzer(currentWorkout)}
            config={workoutConfig}
          />
        </div>
      </div>
    </div>
  );
}
 
export default App
