import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkoutType } from '@/types/workouts';
import { getAllWorkoutTypes, getWorkoutConfig } from '@/config/workouts';

interface WorkoutSelectorProps {
  currentWorkout: WorkoutType;
  onWorkoutChange: (workout: WorkoutType) => void;
  className?: string;
}

export const WorkoutSelector: React.FC<WorkoutSelectorProps> = ({
  currentWorkout,
  onWorkoutChange,
  className,
}) => {
  const workoutTypes = getAllWorkoutTypes();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workoutTypes.map((workoutType) => {
            const config = getWorkoutConfig(workoutType);
            const isActive = currentWorkout === workoutType;
            
            return (
              <Card
                key={workoutType}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onWorkoutChange(workoutType)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {config.displayName}
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {config.description}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Metrics:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.metrics.map((metric) => (
                          <Badge
                            key={metric.name}
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {metric.displayName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-3"
                      disabled
                    >
                      Currently Active
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};