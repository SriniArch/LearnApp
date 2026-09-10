// Educational content is loaded from data/curriculum/<grade>/*.json.
// Shape: Grade (meta.json) + Subject files -> Topic -> Lesson + Questions (base + extra).
// Add a subject by creating <subject>.json and importing it into the grade's subjects array.

import grade3Meta from "@/data/curriculum/grade-3/meta.json"
import grade3Math from "@/data/curriculum/grade-3/math.json"
import grade3Science from "@/data/curriculum/grade-3/science.json"
import grade3Geography from "@/data/curriculum/grade-3/geography.json"
import grade7Meta from "@/data/curriculum/grade-7/meta.json"
import grade7Math from "@/data/curriculum/grade-7/math.json"
import grade7Science from "@/data/curriculum/grade-7/science.json"
import grade7Geography from "@/data/curriculum/grade-7/geography.json"

export type QuestionType = "mcq" | "boolean" | "number"

export interface BaseQuestion {
  id: string
  prompt: string
  explanation: string
}

export interface McqQuestion extends BaseQuestion {
  type: "mcq"
  options: string[]
  answerIndex: number
}

export interface BooleanQuestion extends BaseQuestion {
  type: "boolean"
  answer: boolean
}

export interface NumberQuestion extends BaseQuestion {
  type: "number"
  answer: number
}

export type Question = McqQuestion | BooleanQuestion | NumberQuestion

export interface Lesson {
  // Short, simple points. Avoid long paragraphs.
  concept: string[]
  // A worked example or visual description.
  example: string
}

export interface Topic {
  id: string
  title: string
  lesson: Lesson
  questions: Question[]
}

export interface Subject {
  id: string
  title: string
  icon: string // emoji used only in data (UI maps it to a friendly badge)
  color: SubjectColor
  topics: Topic[]
}

export interface Grade {
  id: string
  title: string
  subjects: Subject[]
}

export type SubjectColor = "math" | "science" | "geography"

interface TopicData {
  id: string
  title: string
  lesson: Lesson
  questions: {
    base: Question[]
    extra: Question[]
  }
}

interface SubjectData {
  id: string
  title: string
  icon: string
  color: SubjectColor
  topics: TopicData[]
}

interface GradeData {
  id: string
  title: string
  subjects: SubjectData[]
}

function loadGrade(data: GradeData): Grade {
  return {
    id: data.id,
    title: data.title,
    subjects: data.subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      icon: subject.icon,
      color: subject.color,
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        lesson: topic.lesson,
        questions: topic.questions.base,
      })),
    })),
  }
}

const gradeData: GradeData[] = [
  {
    ...grade3Meta,
    subjects: [grade3Math, grade3Science, grade3Geography],
  } as GradeData,
  {
    ...grade7Meta,
    subjects: [grade7Math, grade7Science, grade7Geography],
  } as GradeData,
]

export const curriculum: Grade[] = gradeData.map(loadGrade)

// Helpers to look up content by id.
export function getGrade(gradeId: string): Grade | undefined {
  return curriculum.find((g) => g.id === gradeId)
}

export function getSubject(gradeId: string, subjectId: string): Subject | undefined {
  return getGrade(gradeId)?.subjects.find((s) => s.id === subjectId)
}

export function getTopic(gradeId: string, subjectId: string, topicId: string): Topic | undefined {
  return getSubject(gradeId, subjectId)?.topics.find((t) => t.id === topicId)
}

export function getExtraQuestions(
  gradeId: string,
  subjectId: string,
  topicId: string,
): Question[] {
  const grade = gradeData.find((g) => g.id === gradeId)
  const subject = grade?.subjects.find((s) => s.id === subjectId)
  const topic = subject?.topics.find((t) => t.id === topicId)
  return topic?.questions.extra ?? []
}
