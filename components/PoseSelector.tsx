
import React from 'react';

interface PoseSelectorProps {
    selectedPose: string | null;
    onSelectPose: (pose: string) => void;
}

// Helper to generate consistent skeleton SVG Data URIs
// We use stroke-width 3 to ensure the AI clearly sees the bone structure
const createPose = (name: string, svgPath: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="50" cy="25" r="10" fill="white" />
        ${svgPath}
    </svg>`;
    return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        src: `data:image/svg+xml;base64,${btoa(svg)}`
    };
};

const POSES = [
    // --- Standing / Basic ---
    createPose('Neutral Stand', 
        `<path d="M50 35 L50 80 M50 80 L25 180 M50 80 L75 180 M50 45 L20 100 M50 45 L80 100" />`
    ),
    createPose('Runway Walk', 
        `<path d="M50 35 L50 80 M50 80 L30 180 M50 80 L70 160 M50 45 L20 90 M50 45 L80 90" />`
    ),
    createPose('Hand on Hip', 
        `<path d="M50 35 L50 80 M50 80 L30 180 M50 80 L70 180 M50 45 L20 100 M50 45 L75 70 L60 80" />`
    ),
    createPose('Hands on Waist', 
        `<path d="M50 35 L50 80 M50 80 L25 180 M50 80 L75 180 M50 45 L25 70 L40 80 M50 45 L75 70 L60 80" />`
    ),
    createPose('Crossed Arms', 
        `<path d="M50 35 L50 80 M50 80 L25 180 M50 80 L75 180 M50 45 L25 65 L75 65 M75 65 L50 45" />`
    ),
    
    // --- Fashion / Dynamic ---
    createPose('Vogue / Head', 
        `<path d="M50 35 L50 80 M50 80 L40 180 M50 80 L80 170 M50 45 L80 25 M50 45 L20 70 L35 80" />`
    ),
    createPose('Wide Stance', 
        `<path d="M50 35 L50 80 M50 80 L15 180 M50 80 L85 180 M50 45 L15 90 M50 45 L85 90" />`
    ),
    createPose('Leaning Casual', 
        `<path d="M50 35 Q45 60 40 80 M40 80 L40 180 M40 80 L70 170 M40 45 L15 100 M40 45 L65 100" />`
    ),
    createPose('Side Walking', 
        `<path d="M50 35 L50 80 M50 80 L35 180 M50 80 L65 180 M50 45 L40 90 M50 45 L60 90" />`
    ),
    createPose('High Fashion', 
        `<path d="M50 35 L50 80 M50 80 L30 180 M50 80 L70 180 M50 45 L80 35 M50 45 L20 80 L40 90" />`
    ),
    createPose('Presenting', 
        `<path d="M50 35 L50 80 M50 80 L35 180 M50 80 L65 180 M50 45 L20 100 M50 45 L90 60" />`
    ),
    createPose('Hands in Pockets', 
        `<path d="M50 35 L50 80 M50 80 L30 180 M50 80 L70 180 M50 45 L30 85 L35 95 M50 45 L70 85 L65 95" />`
    ),
    createPose('Hand in Hair', 
        `<path d="M50 35 L50 80 M50 80 L35 180 M50 80 L65 180 M50 45 L20 90 M50 45 L85 20" />`
    ),

    // --- Sitting / Floor / Special ---
    createPose('Sitting Stool', 
        `<path d="M50 35 L50 90 M50 90 L20 110 M20 110 L20 170 M50 90 L80 110 M80 110 L80 170 M50 45 L20 100 M50 45 L80 100" />`
    ),
    createPose('Sitting Floor', 
        `<path d="M50 50 L50 100 M50 100 L20 130 L40 130 M50 100 L80 130 L60 130 M50 60 L30 90 M50 60 L70 90" />`
    ),
    createPose('Crouching', 
        `<path d="M50 60 L50 100 M50 100 L20 140 L15 180 M50 100 L80 140 L85 180 M50 70 L30 120 M50 70 L70 120" />`
    ),
    createPose('Back View', 
        `<path d="M50 35 L50 80 M50 80 L30 180 M50 80 L70 180 M50 45 L20 100 M50 45 L80 100" /> <path d="M45 30 L55 30" stroke-width="1" />` // Subtle hint of back
    ),
    createPose('Dynamic Jump', 
        `<path d="M50 40 L50 80 M50 80 L20 130 L30 150 M50 80 L80 120 L70 140 M50 50 L10 30 M50 50 L90 30" />`
    ),
    createPose('Reclining', 
        `<path d="M30 100 L70 120 M70 120 L90 140 M90 140 L95 180 M70 120 L60 150 M60 150 L50 180 M30 100 L20 130 M30 100 L50 80" />`
    ),
    createPose('Yoga / Tree', 
        `<path d="M50 35 L50 80 M50 80 L50 180 M50 80 L80 120 L50 130 M50 45 L20 20 M50 45 L80 20" />`
    )
];

const PoseSelector: React.FC<PoseSelectorProps> = ({ selectedPose, onSelectPose }) => {
    return (
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {POSES.map((pose) => (
                    <button
                        key={pose.id}
                        onClick={() => onSelectPose(pose.src)}
                        className={`relative aspect-[1/2] rounded-lg border-2 overflow-hidden group transition-all duration-200 ${
                            selectedPose === pose.src 
                            ? 'border-indigo-500 bg-indigo-900/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                        title={pose.name}
                    >
                        {/* We invert the image because the SVGs are White lines (for the AI mask), but displayed on light/dark background for UI */}
                        <div className="absolute inset-0 p-3 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <img 
                                src={pose.src} 
                                alt={pose.name} 
                                className="w-full h-full object-contain filter drop-shadow-lg" 
                            />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm py-1.5 px-1 text-[10px] text-center text-slate-200 truncate border-t border-white/5">
                            {pose.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PoseSelector;
