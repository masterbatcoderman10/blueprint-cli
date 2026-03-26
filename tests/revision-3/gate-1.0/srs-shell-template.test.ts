import { access, readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { resolveTemplatePath } from '../../../src/doctor/inventory'

describe('T-R3-1.0.4.1: templates/srs.md exists and contains {{project-name}}', () => {
  it('exists and includes the project-name interpolation token', async () => {
    const templatePath = resolveTemplatePath('srs.md')

    await expect(access(templatePath)).resolves.toBeUndefined()

    const content = await readFile(templatePath, 'utf-8')
    expect(content).toContain('{{project-name}}')
  })
})

describe('T-R3-1.0.4.2: templates/srs.md contains MoSCoW headings plus metadata scaffolding', () => {
  it('includes the expected editable SRS sections and placeholders', async () => {
    const templatePath = resolveTemplatePath('srs.md')
    const content = await readFile(templatePath, 'utf-8')

    expect(content).toContain('# {{project-name}} - Software Requirements Specification')
    expect(content).toContain('## Requirement Index')
    expect(content).toContain('## Requirements')
    expect(content).toContain('### Must Have')
    expect(content).toContain('### Should Have')
    expect(content).toContain('### Could Have')
    expect(content).toContain("### Won't Have")
    expect(content).toContain('## Requirement Metadata')
    expect(content).toContain('Change log:')
    expect(content).toContain('## Data Schema')
  })
})
