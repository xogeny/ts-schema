export type PathElement = string | number;
export type Path = PathElement[];

export function serializePath(path: Path): string {
    // Old code, but slow...
    //let idpath = path.map((v: string | number) => v.toString())
    //let id = pointer.compile(idpath);
    
    if (path.length===0) { return ""; }
    let id = "/"+path.join("/");
    return id;
}
