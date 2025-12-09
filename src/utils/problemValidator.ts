import type { ProblemConfig } from '../store/types'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export function validateProblemExample(example: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  const prefix = `examples[${index}]`
  
  if (!example || typeof example !== 'object') {
    errors.push({ field: prefix, message: 'Example must be an object' })
    return errors
  }
  
  const ex = example as Record<string, unknown>
  
  if (typeof ex.input !== 'string') {
    errors.push({ field: `${prefix}.input`, message: 'Input must be a string' })
  }
  if (typeof ex.output !== 'string') {
    errors.push({ field: `${prefix}.output`, message: 'Output must be a string' })
  }
  if (ex.explanation !== undefined && typeof ex.explanation !== 'string') {
    errors.push({ field: `${prefix}.explanation`, message: 'Explanation must be a string' })
  }
  
  return errors
}

export function validateProblem(problem: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!problem || typeof problem !== 'object') {
    return { valid: false, errors: [{ field: 'problem', message: 'Problem must be an object' }] }
  }
  
  const p = problem as Record<string, unknown>
  
  // Required string fields
  if (typeof p.id !== 'string' || p.id.trim() === '') {
    errors.push({ field: 'id', message: 'ID is required and must be a non-empty string' })
  }
  if (typeof p.title !== 'string' || p.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' })
  }
  if (typeof p.description !== 'string' || p.description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required and must be a non-empty string' })
  }
  if (typeof p.template !== 'string') {
    errors.push({ field: 'template', message: 'Template is required and must be a string' })
  }
  if (typeof p.inputFormat !== 'string') {
    errors.push({ field: 'inputFormat', message: 'InputFormat must be a string' })
  }
  if (typeof p.outputFormat !== 'string') {
    errors.push({ field: 'outputFormat', message: 'OutputFormat must be a string' })
  }
  
  // Difficulty validation
  if (!VALID_DIFFICULTIES.includes(p.difficulty as typeof VALID_DIFFICULTIES[number])) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be easy, medium, or hard' })
  }
  
  // Examples validation
  if (!Array.isArray(p.examples)) {
    errors.push({ field: 'examples', message: 'Examples must be an array' })
  } else {
    p.examples.forEach((ex, i) => {
      errors.push(...validateProblemExample(ex, i))
    })
  }
  
  // Optional arrays validation
  if (p.constraints !== undefined) {
    if (!Array.isArray(p.constraints)) {
      errors.push({ field: 'constraints', message: 'Constraints must be an array' })
    } else if (!p.constraints.every((c): c is string => typeof c === 'string')) {
      errors.push({ field: 'constraints', message: 'All constraints must be strings' })
    }
  }
  
  if (p.hints !== undefined) {
    if (!Array.isArray(p.hints)) {
      errors.push({ field: 'hints', message: 'Hints must be an array' })
    } else if (!p.hints.every((h): h is string => typeof h === 'string')) {
      errors.push({ field: 'hints', message: 'All hints must be strings' })
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export function validateProblemConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: [{ field: 'config', message: 'Config must be an object' }] }
  }
  
  const c = config as Record<string, unknown>
  
  if (!Array.isArray(c.problems)) {
    return { valid: false, errors: [{ field: 'problems', message: 'Problems must be an array' }] }
  }
  
  const seenIds = new Set<string>()
  
  c.problems.forEach((problem, index) => {
    const result = validateProblem(problem)
    result.errors.forEach(err => {
      errors.push({ field: `problems[${index}].${err.field}`, message: err.message })
    })
    
    // Check for duplicate IDs
    const p = problem as Record<string, unknown>
    if (typeof p.id === 'string') {
      if (seenIds.has(p.id)) {
        errors.push({ field: `problems[${index}].id`, message: `Duplicate problem ID: ${p.id}` })
      }
      seenIds.add(p.id)
    }
  })
  
  return { valid: errors.length === 0, errors }
}

export function parseProblemConfig(json: string): { config: ProblemConfig | null; errors: ValidationError[] } {
  try {
    const parsed = JSON.parse(json)
    const result = validateProblemConfig(parsed)
    if (result.valid) {
      return { config: parsed as ProblemConfig, errors: [] }
    }
    return { config: null, errors: result.errors }
  } catch (e) {
    return { config: null, errors: [{ field: 'json', message: `Invalid JSON: ${(e as Error).message}` }] }
  }
}

export function serializeProblemConfig(config: ProblemConfig): string {
  return JSON.stringify(config, null, 2)
}
