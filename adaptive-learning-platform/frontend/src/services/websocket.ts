import { useEffect, useState } from 'react';

// Mock WebSocket Hook for Real-time Infrastructure (Phase 9)
// In a real environment, this connects to AWS API Gateway WebSockets

export interface AlertEvent {
    id: string;
    type: 'intervention_required' | 'content_ready' | 'system_status';
    severity: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    timestamp: string;
    contextData?: any;
}

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

export const useRealtimeAlerts = (role: 'student' | 'teacher') => {
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Determine connection based on role
        // For the UI demo, we simulate receiving a WebSocket event after a delay

        setIsConnected(true);

        const timer = setTimeout(() => {
            if (role === 'teacher') {
                const simulatedEvent: AlertEvent = {
                    id: `evt_${Date.now()}`,
                    type: 'intervention_required',
                    severity: 'high',
                    title: 'Early Warning System Alert',
                    message: 'Jordan Lee\'s interaction velocity has dropped by 60% in the last 15 minutes while attempting Quadratic Formula.',
                    timestamp: new Date().toISOString(),
                    contextData: { studentId: 's3', conceptId: 'c1' }
                };

                setAlerts(prev => [simulatedEvent, ...prev]);
            }
        }, 15000); // Trigger a simulated alert 15 seconds after loading the dashboard

        return () => {
            setIsConnected(false);
            clearTimeout(timer);
        };
    }, [role]);

    const dismissAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return { alerts, isConnected, dismissAlert };
};
