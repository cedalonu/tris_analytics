export interface MountScanFile { path: string; content: string; }
export interface MountReferenceEvidence { file: string; imported: boolean; jsx: boolean; }

/** Detect source-level import and JSX references; not a runtime mount guarantee. */
export function findComponentReferences(componentName: string, files: MountScanFile[]): MountReferenceEvidence[] {
  if (!/^[A-Za-z_$][\w$]*$/.test(componentName)) throw new Error("invalid component name");
  const importPattern = new RegExp(`import\\s+(?:[\\w{},*\\s]+\\s+from\\s+)?["']\\./(?:research/)?${componentName}(?:\\.tsx)?["']|import\\s+${componentName}\\s+from\\s+["']\\./(?:research/)?${componentName}(?:\\.tsx)?["']`);
  const jsxPattern = new RegExp(`<${componentName}(?:\\s|/|>)`);
  return files.flatMap(({path,content})=>{
    const jsxSource=content
      .replace(/\/\*[\s\S]*?\*\//g,"")
      .replace(/\/\/[^\n]*/g,"")
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,"");
    const imported=importPattern.test(content),jsx=jsxPattern.test(jsxSource);
    return imported||jsx?[{file:path,imported,jsx}]:[];
  });
}
