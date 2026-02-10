import React from 'react';

interface MilestoneShapeProps {
    shape: string;
}

const MilestoneShape: React.FC<MilestoneShapeProps> = ({ shape }) => {
    const classes = "text-purple-600 dark:text-purple-400 fill-current";
    switch (shape) {
        case 'square': return <rect x="2" y="2" width="12" height="12" className={classes} />;
        case 'triangle': return <polygon points="8,2 14,14 2,14" className={classes} />;
        case 'diamond': return <polygon points="8,2 14,8 8,14 2,8" className={classes} />;
        case 'star': return <polygon points="8,1 10,6 15,6 11,9 12,14 8,11 4,14 5,9 1,6 6,6" className={classes} />;
        case 'flag': return <path d="M4 2 L12 2 L12 10 L4 10 Z M4 2 L4 14" className={classes} stroke="currentColor" strokeWidth="2" fill="none" />;
        case 'circle':
        default: return <circle cx="8" cy="8" r="6" className={classes} />;
    }
}

export default MilestoneShape;
