import React from 'react';

interface Props {
    title: string;
    description: string;
}

const PlaceholderApp: React.FC<Props> = ({ title, description }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#f2f2f2] text-gray-600 p-8 text-center">
            <h1 className="text-2xl font-bold mb-2 text-[#333]">{title}</h1>
            <p className="max-w-md">{description}</p>
        </div>
    );
};

export default PlaceholderApp;