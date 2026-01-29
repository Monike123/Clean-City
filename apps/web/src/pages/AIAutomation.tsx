import { useState } from 'react';
import { Brain, Target, Zap, Shield, ChevronDown, Camera, Play, Pause, MapPin, Building, Users, Leaf } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const AI_SERVICE_URL = 'http://localhost:5000';

export default function AIAutomation() {
    const [showDemo, setShowDemo] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const toggleDetection = async () => {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/api/toggle`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                setIsActive(data.active);
            }
        } catch {
            console.log('Service not running');
        }
    };

    const checkConnection = async () => {
        try {
            const res = await fetch(`${AI_SERVICE_URL}/api/status`);
            setIsConnected(res.ok);
        } catch {
            setIsConnected(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 overflow-y-auto">

            {/* Hero Section */}
            <section className="relative py-16 px-6 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                            <Leaf className="w-8 h-8" />
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">Powered by YOLOv11</Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        City Eye AI Surveillance
                    </h1>

                    <p className="text-xl text-green-100 mb-8 max-w-2xl leading-relaxed">
                        Transforming Mumbai's CCTV network into an intelligent waste monitoring system.
                        Real-time garbage detection with <strong className="text-white">95.73% accuracy</strong>.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => { setShowDemo(true); checkConnection(); }}
                            className="flex items-center bg-white text-green-700 hover:bg-green-50 px-6 py-3 rounded-lg font-medium shadow-lg transition-colors"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            View Live Demo
                        </button>
                        <a
                            href="/Implemnet_plan_1.pdf"
                            download="Implemnet_plan_1.pdf"
                            className="flex items-center border-2 border-white/50 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
                        >
                            <MapPin className="w-5 h-5 mr-2" />
                            Download Deployment Plan
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 px-6 bg-white border-b">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">95.73%</div>
                        <div className="text-gray-500 text-sm">mAP@50 Accuracy</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">90.1%</div>
                        <div className="text-gray-500 text-sm">Precision</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">86.8%</div>
                        <div className="text-gray-500 text-sm">Recall</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">30 FPS</div>
                        <div className="text-gray-500 text-sm">Real-time Speed</div>
                    </div>
                </div>
            </section>

            {/* Mumbai Integration Vision */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">Mumbai Deployment</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart City Surveillance Integration</h2>
                    <p className="text-gray-600 mb-10 max-w-3xl">
                        Transform existing city surveillance cameras from passive recording devices into active
                        monitoring systems that understand what they see. Instead of waiting for citizens to
                        report garbage, the system detects issues the moment they appear.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-green-600" />
                                Edge Computing Architecture
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Each camera location is equipped with a compact computing device with AI acceleration.
                                These edge devices process video locally, running YOLO inference on every frame.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Only detection results transmitted, reducing bandwidth
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Real-time processing without central server load
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Works with existing CCTV infrastructure
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Intelligent Verification Loop
                            </h3>
                            <p className="text-gray-600 mb-4">
                                When an admin marks a report as resolved, the system verifies by checking if garbage
                                is actually gone. This catches false resolutions and ensures accountability.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Auto-escalation for persistent garbage
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Re-opens falsely resolved reports
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Creates cleanup accountability record
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Mumbai Ward Coverage */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            Strategic Deployment - Mumbai Wards
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Initial pilot deployment focuses on high-priority areas across Mumbai's 24 wards:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-semibold text-green-700">Commercial Districts</div>
                                <div className="text-gray-500">High foot traffic areas</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-semibold text-green-700">Public Parks</div>
                                <div className="text-gray-500">Constant maintenance needed</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-semibold text-green-700">Transport Hubs</div>
                                <div className="text-gray-500">Stations & terminals</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-semibold text-green-700">Collection Points</div>
                                <div className="text-gray-500">Overflow monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Detection Pipeline</h2>
                    <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                        Smart validation ensures only confirmed garbage is reported
                    </p>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: Camera, title: "Capture", desc: "30 FPS video stream from city CCTV" },
                            { icon: Brain, title: "AI Inference", desc: "YOLOv11 processes each frame in 33ms" },
                            { icon: Target, title: "Validation", desc: "3+ frame confirmation at 95% confidence" },
                            { icon: Zap, title: "Auto Report", desc: "Verified garbage creates instant report" }
                        ].map((item, idx) => (
                            <div key={idx} className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Model Performance */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Model Performance</h2>
                    <p className="text-gray-600 text-center mb-12">
                        YOLOv11m architecture • 125 layers • 20M parameters
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Metrics */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-6">Validation Metrics</h3>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Precision</span>
                                        <span className="font-medium">90.1%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '90.1%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Recall</span>
                                        <span className="font-medium">86.8%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '86.8%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">mAP@50</span>
                                        <span className="font-medium text-green-600">95.73%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '95.73%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">mAP@50-95</span>
                                        <span className="font-medium">74.7%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '74.7%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Class Performance */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-6">Class Detection</h3>

                            <div className="space-y-4">
                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-900">🗑️ Trash</span>
                                        <Badge className="bg-green-100 text-green-700">94.5% mAP</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-xs text-center">
                                        <div><span className="text-gray-500">P:</span> 0.88</div>
                                        <div><span className="text-gray-500">R:</span> 0.75</div>
                                        <div><span className="text-gray-500">Speed:</span> 33ms</div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-900">✓ Clean Area</span>
                                        <Badge className="bg-gray-100 text-gray-700">97.0% mAP</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-xs text-center">
                                        <div><span className="text-gray-500">P:</span> 0.92</div>
                                        <div><span className="text-gray-500">R:</span> 0.99</div>
                                        <div><span className="text-gray-500">Speed:</span> 33ms</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Training Plots */}
            <section className="py-16 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Training Visualizations</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                            <img src="/ai_plots/train_results.png" alt="Training Results" className="w-full" />
                            <div className="p-3 text-center text-sm text-gray-600">Training Metrics</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                            <img src="/ai_plots/train_BoxPR_curve.png" alt="PR Curve" className="w-full" />
                            <div className="p-3 text-center text-sm text-gray-600">Precision-Recall</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                            <img src="/ai_plots/train_confusion_matrix.png" alt="Confusion Matrix" className="w-full" />
                            <div className="p-3 text-center text-sm text-gray-600">Confusion Matrix</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => { setShowDemo(!showDemo); if (!showDemo) checkConnection(); }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Camera className="w-7 h-7 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Live Detection Demo</h3>
                                    <p className="text-gray-500 text-sm">Try with your webcam - no data saved</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {showDemo && (
                        <div className="mt-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Badge className={isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                    {isConnected ? '🟢 Connected' : '🔴 Offline'}
                                </Badge>
                                <button
                                    onClick={toggleDetection}
                                    disabled={!isConnected}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isActive ? <><Pause className="w-4 h-4 mr-1" /> Stop</> : <><Play className="w-4 h-4 mr-1" /> Start</>}
                                </button>
                            </div>

                            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                                {isConnected ? (
                                    <img src={`${AI_SERVICE_URL}/video_feed`} alt="Live Feed" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <Camera className="w-12 h-12 mb-3 opacity-50" />
                                        <p>Start the AI Service</p>
                                        <code className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded mt-2">
                                            cd apps/ai_sentinel && python sentinel.py
                                        </code>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 px-6 bg-green-800 text-center text-green-200 text-sm">
                City Eye AI • Clear City Platform • Built with YOLOv11
            </footer>
        </div>
    );
}
