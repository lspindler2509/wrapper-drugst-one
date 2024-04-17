import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Node, Edge } from './interface';
import { MatIconModule } from '@angular/material/icon';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, CommonModule, MatSelectModule, MatTooltipModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'wrapper-drugst-one';

  public nodes: Node[] = [];
  public edges: Edge[] = [];
  public seedFile: any;
  public interactionFile: any;
  public network: any;
  public selectedFormat: string = 'sif';

  public sifText: string = "SIF (Simple Interaction Format)\n" +
    "Example:\n" +
    "Q9HCD6  -  Q9P244\n"

  public csvText: string = "Adjacency list - tab seperated.\n" +
    "Example:\n" +
    "Q9HCD6\\tQ9P244"
  
  public graphmlText: string = "Graphml object"


  seedFileName: string | undefined;
  interactionFileName: string | undefined;


  addSeedFile(event: any) {
    this.seedFileName = event.target.files[0].name;
    this.seedFile = event;
  }

  addInteractionFile(event: any) {
    this.interactionFileName = event.target.files[0].name;
    this.interactionFile = event;
  }

  readInteractions(event: any, seedGenes: Set<string>, format: string) {
    this.nodes = [];
    this.edges = [];
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const contents: string = e.target.result;
      const lines: string[] = contents.split('\n');

      // Set to have unique nodes and edges
      const uniqueNodes = new Set<string>();
      const uniqueEdges = new Set<string>();

      lines.forEach(line => {

        // check if Line empty
        if (line.trim().length === 0) {
          return; // Wenn die Zeile leer ist, wird sie übersprungen
        }

        let cleanFrom: string, cleanTo: string;
        if (format === 'csv') {
          const [from, to] = line.split(',');

          // check if line format correct
          if (from && to) {
            // delete idspace prefix if exists
            cleanFrom = from.trim().split('.').length > 1 ? from.trim().split('.')[1] : from.trim();
            cleanTo = to.trim().split('.').length > 1 ? to.trim().split('.')[1] : to.trim();
          } else {
            console.warn('Ignored line:', line);
            return;
          }
        } else if (format === 'sif') {
          // Split line by whitespace
          const parts = line.trim().split(/\s+/);
          if (parts.length !== 3) {
            if (parts.length < 3) {
              // isolated node that has no edges -> only add to nodes
              const isolatedNodeId = parts[0].trim().split('.').length > 1 ? parts[0].trim().split('.')[1] : parts[0].trim();
              console.log("Isolated node! ", isolatedNodeId)
              const group = seedGenes.has(isolatedNodeId) ? 'important' : 'gene';
              if (!uniqueNodes.has(isolatedNodeId)) {
                this.nodes.push({ id: isolatedNodeId, group: group });
                uniqueNodes.add(isolatedNodeId);
              }
            }
            return;
          }
          cleanFrom = parts[0].trim().split('.').length > 1 ? parts[0].trim().split('.')[1] : parts[0].trim();
          cleanTo = parts[2].trim().split('.').length > 1 ? parts[2].trim().split('.')[1] : parts[2].trim();
        } else {
          console.error('Unsupported file format:', format);
          return;
        }

        // undirected graph -> check that edge between 2 proteins only once used
        const edgeKey = [cleanFrom, cleanTo].sort().join('-');

        // only add node if it doesn't exist already
        if (!uniqueNodes.has(cleanFrom)) {
          const group = seedGenes.has(cleanFrom) ? 'important' : 'gene';
          this.nodes.push({ id: cleanFrom, group: group });
          uniqueNodes.add(cleanFrom);
        }
        if (!uniqueNodes.has(cleanTo)) {
          const group = seedGenes.has(cleanTo) ? 'important' : 'gene';
          this.nodes.push({ id: cleanTo, group: group });
          uniqueNodes.add(cleanTo);
        }

        // only add edge if it doesn't exist yet
        if (!uniqueEdges.has(edgeKey)) {
          this.edges.push({ from: cleanFrom, to: cleanTo });
          uniqueEdges.add(edgeKey);
        }
      });

      console.log('Nodes:', this.nodes);
      console.log('Edges:', this.edges);
      this.network = {
        nodes: this.nodes,
        edges: this.edges
      };
    };

    reader.readAsText(file);
  }

  readSeedFile(event: any): Set<string> {
    const seedGenes = new Set<string>();
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const contents: string = e.target.result;
      const lines = contents.split('\n');
      lines.forEach(line => {
        if (line.trim().length === 0) {
          return;
        }
        const cleanId = line.trim().split('.').length > 1 ? line.trim().split('.')[1] : line.trim();
        seedGenes.add(cleanId);
      });
    };
    reader.readAsText(event.target.files[0]);
    return (seedGenes)
  }

  onFileUpload() {

    if (this.seedFile && this.interactionFile) {
      this.nodes = []
      this.edges = []
      this.network = {}

      if (this.selectedFormat == "csv" || this.selectedFormat == "sif") {
        const seedSet = this.readSeedFile(this.seedFile)
        this.readInteractions(this.interactionFile, seedSet, this.selectedFormat)
      } else if (this.selectedFormat == "graphml") {
        const seedSet = this.readSeedFile(this.seedFile)

      }
    } else if (this.interactionFile) {
      this.nodes = []
      this.edges = []
      this.network = {}

      if (this.selectedFormat == "csv" || this.selectedFormat == "sif") {
        this.readInteractions(this.interactionFile, new Set<string>, this.selectedFormat)
      } else if (this.selectedFormat == "graphml") {

      }

    }

  }

}
