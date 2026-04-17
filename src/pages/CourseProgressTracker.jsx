import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Search, Loader2 } from 'lucide-react';
import EnrollmentProgressCard from '@/components/progress/EnrollmentProgressCard';

export default function CourseProgressTracker() {
  const [search, setSearch] = useState('');

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.CourseEnrollment.list('-enrollment_date', 100),
  });

  const filtered = enrollments.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.student_name?.toLowerCase().includes(q) ||
      e.course_title?.toLowerCase().includes(q) ||
      e.student_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Course Progress Tracker</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View and update module-level progress for each enrolled student.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student, course, or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No results found.' : 'No enrollments yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(enrollment => (
            <EnrollmentProgressCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}