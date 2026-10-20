export type CourseId = 'games101' | 'unity' | 'games104';

export interface CourseChapter {
  id: string; number: string; title: string; originalTitle: string;
  source: string; sourceLabel: string;
  points: { title: string; text: string; source: string }[];
  note?: string;
  sourceLanguage?: 'en' | 'zh' | 'mixed';
}

export interface CourseDigest {
  id: CourseId; name: string; title: string; scope: string; url: string;
  chapters: CourseChapter[];
  note?: string;
  sourceLanguage?: 'en' | 'zh' | 'mixed';
}
