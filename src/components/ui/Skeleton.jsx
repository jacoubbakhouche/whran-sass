import React from 'react';
import './Skeleton.css';

/**
 * Reusable Skeleton component for loading states.
 * 
 * @param {string} width - Width of the skeleton (e.g., '100%', '200px').
 * @param {string} height - Height of the skeleton (e.g., '16px', '100px').
 * @param {string} variant - Type of skeleton: 'text', 'circle', or 'rect' (default).
 * @param {string} className - Additional CSS classes.
 * @param {object} style - Inline styles for custom dimensions.
 */
export default function Skeleton({ 
    width, 
    height, 
    variant = 'rect', 
    className = '', 
    style = {} 
}) {
    const skeletonClasses = `skeleton-base skeleton-${variant} ${className}`;
    
    const combinedStyle = {
        width: width || (variant === 'circle' ? '50px' : '100%'),
        height: height || (variant === 'circle' ? '50px' : '20px'),
        ...style
    };

    return (
        <div 
            className={skeletonClasses} 
            style={combinedStyle} 
            aria-hidden="true"
        />
    );
}
