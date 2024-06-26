export interface Node {
    id: string;
    group: string;
}

// Definition der Edge-Schnittstelle
export interface Edge {
    from: string;
    to: string;
}


export interface Network {
    nodes: Node[];
    edges: Edge[];
}