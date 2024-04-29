import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Node, Edge, Network} from './interface';
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
  public network: Network = {nodes: [], edges: []};
  public selectedFormat: string = 'sif';
  public selectedIdspace: string = 'uniprot';

  public config: string = '{"customEdges":{"default":true, "selectable":false}, "showAdvAnalysisContent":["drug-search", "drug-target-search", "pathway-enrichment","enrichment-gprofiler", "enrichment-digest", "search-ndex"],"identifier":"uniprot","title":"ROBUST output network", "taskDrugName": "Drug search", "showLegendNodes": true, "showLegendEdges": true, "showSidebar": "left", "showOverview": true, "legendPos": "left", "legendClass": "legend", "showQuery": true, "showItemSelector": true,"showSimpleAnalysis": true,"showAdvAnalysis": true,"showSelection": true,"showTasks": true,"showNetworkMenu": "right","showLegend": true,"showNetworkMenuButtonExpression": true, "showNetworkMenuButtonScreenshot": true,"showNetworkMenuButtonExportGraphml": true,"showNetworkMenuButtonAdjacentDrugs": true,"showNetworkMenuButtonCenter": true,"showConnectGenes": true,"networkMenuButtonAdjacentDrugsLabel": "Drugs","showNetworkMenuButtonAdjacentDisordersProteins": true,"networkMenuButtonAdjacentDisordersProteinsLabel": "Disorders (protein)","showNetworkMenuButtonAdjacentDisordersDrugs": true,"networkMenuButtonAdjacentDisordersDrugsLabel": "Disorders (drug)","showNetworkMenuButtonAnimation": true,"networkMenuButtonAnimationLabel": "Animation", "autofillEdges": true, "useNedrexLicenced": true,"selfReferences": false, "interactionDrugProtein": "NeDRex", "indicationDrugDisorder": "NeDRex","nodeShadow": true,"edgeShadow": true, "algorithms": {"drug": ["trustrank", "closeness", "degree", "proximity"], "drug-target": ["trustrank", "multisteiner", "keypathwayminer", "degree", "closeness", "betweenness", "louvain-clustering"], "gene":["pathway-enrichment"]}, "associatedProteinDisorder": "NeDRex", "nodeGroups":{"overlap":{"color":"#FC6C85","shape":"circle","type":"gene","font":{"color":"#000000"},"groupName":"overlap"},"onlyNetwork":{"color":"#ffff00","shape":"circle","type":"gene","font":{"color":"#000000"},"groupName":"only in network"},"onlyPathway":{"color":"#ffa500","shape":"circle","type":"gene","font":{"color":"#000000"},"groupName":"only in pathway"}, "important":{"type":"gene","color":"#ff881f","font":{"color":"#000000"},"groupName":"Seed","shape":"star"},"gene":{"type":"gene","color":"#4da300","font":{"color":"#f0f0f0"},"groupName":"Discovered target","shape":"circle"},"foundDrug":{"type":"drug","color":"#F12590","font":{"color":"#000000"},"groupName":"Drug","shape":"diamond"}},"edgeGroups":{"default":{"color":"#000000","groupName":"default edge"}}}'



  public sifText: string = "SIF (Simple Interaction Format)\n" +
    "Example:\n" +
    "Q9HCD6  -  Q9P244\n"

  public csvText: string = "Adjacency list - tab seperated.\n" +
    "Example:\n" +
    "Q9HCD6\\tQ9P244"
  
  public graphmlText: string = "Graphml object"

  public textSeedfile: string = "Optional seedfile, one id per line."
  
  public textPPIfile: string = "Required PPI file in the chosen format."



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

  parseGraphML(content: string, seedGenes: Set<string>): Network {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');

    const graphNodes = xmlDoc.getElementsByTagName('node');
    for (let i = 0; i < graphNodes.length; i++) {
      const node = graphNodes[i];
      const id = node.getAttribute('id') || '';
      const group = seedGenes.has(id) ? 'important' : 'gene';
      nodes.push({ id , group});
    }

    const graphEdges = xmlDoc.getElementsByTagName('edge');
    for (let i = 0; i < graphEdges.length; i++) {
      const edge = graphEdges[i];
      const from = edge.getAttribute('source') || '';
      const to = edge.getAttribute('target') || '';
      edges.push({ from, to });
    }

    return { nodes, edges };
  }

  readInteractionsGraphml(event: any, seedGenes: Set<string>){

    const file: File = event.target.files[0];

    //TODO: check object and correct it

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const contents: string = e.target.result;
      const data: Network = this.parseGraphML(contents, seedGenes);
      console.log(data)
      this.nodes = data.nodes;
      this.edges = data.edges;
      this.network = {
        nodes: this.nodes,
        edges: this.edges
      };
    };
    reader.readAsText(file, 'UTF-8');
  }

  readInteractionsText(event: any, seedGenes: Set<string>, format: string) {
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

  private updateIdentifierValue(): void {
    const configObject = JSON.parse(this.config);
    configObject.identifier = this.selectedIdspace;
    this.config = JSON.stringify(configObject);
  }


  onFileUpload() {
    this.updateIdentifierValue()
    if (this.seedFile && this.interactionFile) {
      this.nodes = [];
      this.edges = [];
      this.network = { nodes: [], edges: [] };

      if (this.selectedFormat == "csv" || this.selectedFormat == "sif") {
        const seedSet = this.readSeedFile(this.seedFile)
        this.readInteractionsText(this.interactionFile, seedSet, this.selectedFormat)
      } else if (this.selectedFormat == "graphml") {
        const seedSet = this.readSeedFile(this.seedFile)
        this.readInteractionsGraphml(this.interactionFile, seedSet)
      }
    } else if (this.interactionFile) {
      this.nodes = [];
      this.edges = [];
      this.network = { nodes: [], edges: [] };

      if (this.selectedFormat == "csv" || this.selectedFormat == "sif") {
        this.readInteractionsText(this.interactionFile, new Set<string>, this.selectedFormat)
      } else if (this.selectedFormat == "graphml") {
        this.readInteractionsGraphml(this.interactionFile, new Set<string>)
      }

    }

  }

}
