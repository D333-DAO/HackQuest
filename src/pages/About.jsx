import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Users, Zap, BookOpen, Trophy } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 mb-2">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">About HackQuest</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The cybersecurity training platform built for the next generation of security professionals.
        </p>
      </div>

      {/* What is HackQuest */}
      <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">What is HackQuest?</h2>
        <div className="text-muted-foreground leading-relaxed space-y-3">
          <p>
            HackQuest is an interactive cybersecurity learning platform that combines hands-on labs,
            structured learning paths, quizzes, and an advanced attack simulation sandbox — all in one place.
            Whether you are just starting out in cybersecurity or are an experienced practitioner looking to
            sharpen your offensive and defensive skills, HackQuest has something for you.
          </p>
          <p>
            Our platform features a growing library of Capture-the-Flag style rooms covering networking,
            web hacking, cryptography, Linux, Windows, forensics, reverse engineering, privilege escalation,
            OSINT, and more. Each room is carefully crafted with real-world scenarios, guided learning
            material, and answer-validated questions that give you immediate feedback as you progress.
          </p>
          <p>
            Beyond individual rooms, HackQuest offers curated Learning Paths — multi-room journeys aligned
            to popular certifications and career goals such as offensive security, defensive operations, and
            general cybersecurity fundamentals. A built-in Skill Tree lets you visualise your mastery across
            every domain at a glance.
          </p>
          <p>
            The platform also features a live Attack Simulator and Sandbox where you can build custom attack
            scenarios, replay sessions, and observe how threats propagate across virtual network topologies.
            Everything you do earns points, unlocks badges, and moves you up the global Leaderboard — making
            learning genuinely competitive and fun.
          </p>
        </div>
      </div>

      {/* Who it's for */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: BookOpen,
            title: 'Beginners',
            description: 'Start with guided beginner paths, easy rooms, and foundational quizzes. No prior experience required.',
          },
          {
            icon: Target,
            title: 'Professionals',
            description: 'Challenge yourself with hard rooms, MITRE ATT&CK scenarios, and advanced attack simulations.',
          },
          {
            icon: Users,
            title: 'Teams & Students',
            description: 'Follow structured learning paths, track progress, earn certificates, and compete on the leaderboard.',
          },
        ].map(({ icon: Icon, title, description }) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Who builds it */}
      <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Who Builds HackQuest?</h2>
        <p className="text-muted-foreground leading-relaxed">
          HackQuest is built by a passionate team of cybersecurity practitioners and educators who believe
          that the best way to learn security is by doing it. Our team brings together expertise in
          penetration testing, threat intelligence, defensive operations, and educational technology. We
          are committed to keeping the platform up to date with the latest attack techniques, defensive
          strategies, and industry certifications so that every learner stays ahead of the threat landscape.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We are always improving — adding new rooms, quizzes, and features based on community feedback.
          If you have ideas or questions, we'd love to hear from you on our{' '}
          <Link to="/Contact" className="text-primary hover:underline font-medium">Contact page</Link>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: 'Rooms Available', value: '50+' },
          { icon: BookOpen, label: 'Learning Paths', value: '10+' },
          { icon: Zap, label: 'Attack Scenarios', value: '20+' },
          { icon: Users, label: 'Community Members', value: 'Growing' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 text-center space-y-2">
            <Icon className="w-6 h-6 text-primary mx-auto" />
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}