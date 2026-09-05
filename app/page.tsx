'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

const AvatarCard = ({ name, role, firstName, delay }: { name: string, role: string, firstName: string, delay: number }) => {
  const [imgError, setImgError] = useState(false);
  // satya is jpg, everyone else is png
  const ext = firstName.toLowerCase() === 'satya' ? 'jpg' : 'png';
  const imgSrc = `/team/${firstName.toLowerCase()}.${ext}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col items-center hover:bg-white/10 hover:border-fuchsia-500/40 transition-all text-center w-full max-w-[300px] shadow-2xl"
    >
      <div className="w-56 h-72 rounded-2xl mb-5 bg-black/40 border-2 border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
        {!imgError ? (
          <img 
            src={imgSrc} 
            alt={name} 
            onError={() => setImgError(true)} 
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <User className="w-20 h-20 text-gray-600" />
        )}
      </div>
      <p className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-1">{role}</p>
      <h3 className="text-xl font-bold text-white">{name}</h3>
    </motion.div>
  );
};

export default function TeamHomePage() {
  const managers = [
    { name: "Shreya Parira", first: "shreya" },
    { name: "Gopika Rathi", first: "gopika" },
    { name: "Aastha Kedia", first: "aastha" }
  ];

  const coordinators = [
    { name: "Suyash Tatiya", first: "suyash" },
    { name: "Milan", first: "milan" },
    { name: "Anshika", first: "anshika" },
    { name: "Krishnendu", first: "krishnendu" },
    { name: "Devarshi", first: "devarshi" },
    { name: "Naveen", first: "naveen" },
    { name: "Sanjay", first: "sanjay" },
    { name: "Madhumitaa", first: "madhumitaa" }
  ];

  const volunteers = [
    "Kaushal", "Prabhul", "Aman", "Garv", "Bhumi", "Harini", "Muntimadugu hansika"
  ];

  return (
    <div className="min-h-screen text-gray-200 overflow-x-hidden selection:bg-purple-500/30 p-8 pt-16">
      <div className="max-w-6xl mx-auto space-y-16 pb-20">
        <div className="text-center relative">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 tracking-tight mb-4">
            Welcome to the GraVITas Purchase Team
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Driving operations and procurement for the fest.
          </p>
        </div>

        {/* Level 1: Faculty */}
        <div className="flex justify-center">
          <AvatarCard name="Satya Sir" role="Faculty Organizer" firstName="satya" delay={0.1} />
        </div>

        {/* Level 2: Student Organizer */}
        <div className="flex justify-center">
          <AvatarCard name="Sandhiya O H" role="Student Organizer" firstName="sandhiya" delay={0.2} />
        </div>

        {/* Level 3: Managers */}
        <div>
          <div className="flex flex-wrap justify-center gap-6">
            {managers.map((m, i) => (
              <AvatarCard key={m.name} name={m.name} role="Manager" firstName={m.first} delay={0.3 + (i*0.1)} />
            ))}
          </div>
        </div>

        {/* Level 4: Coordinators */}
        <div>
          <div className="flex flex-wrap justify-center gap-6">
            {coordinators.map((c, i) => (
              <AvatarCard key={c.name} name={c.name} role="Coordinator" firstName={c.first} delay={0.4 + (i*0.05)} />
            ))}
          </div>
        </div>

        {/* Level 5: Volunteers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-10 max-w-4xl mx-auto text-center shadow-2xl"
        >
          <h3 className="text-xl font-black text-white mb-8 uppercase tracking-widest text-fuchsia-400">
            Volunteers
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {volunteers.map(v => (
              <span key={v} className="px-5 py-3 bg-black/40 border border-white/5 rounded-xl text-gray-300 font-bold shadow-inner">
                {v}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
