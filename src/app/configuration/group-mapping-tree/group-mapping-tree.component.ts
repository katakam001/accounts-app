import { Component, OnInit } from '@angular/core';
import { GroupMappingService } from '../../services/group-mapping.service';
import { CommonModule } from '@angular/common';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBarModule
import { FormBuilder, FormGroup } from '@angular/forms';
import { GroupNode } from '../../models/group-node.interface';
import { NodeDialogData } from '../../models/node-dialog-data.interface';
import { NodeDialogComponent } from '../../dialogbox/node-dialog/node-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-group-mapping-tree',
  templateUrl: './group-mapping-tree.component.html',
  styleUrls: ['./group-mapping-tree.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule // Add MatSnackBarModule
  ]
})
export class GroupMappingTreeComponent implements OnInit {
  childrenAccessor = (node: GroupNode) => node.children ?? [];
  dataSource: GroupNode[] = [];
  addNodeForm: FormGroup;
  selectedParentId: number | null = null;
  financialYear: string;
  userId: number;

  constructor(
    private groupMappingService: GroupMappingService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {
    this.addNodeForm = this.fb.group({
      name: [''],
      parent_id: [null]
    });
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadData(this.userId, this.financialYear);
    }
  }

  loadData(userId: number, financialYear: string): void {
    this.groupMappingService.getGroupMappingTree(userId,financialYear).subscribe(data => {
      this.dataSource = data;
    });
  }

  hasChild = (_: number, node: GroupNode) => !!node.children && node.children.length > 0;

  openDialog(data: NodeDialogData): void {
    const dialogRef = this.dialog.open(NodeDialogComponent, {
      width: '300px',
      data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNode(result);
      }
    });
  }

  openAddParentNodeDialog(): void {
    const dialogRef = this.dialog.open(NodeDialogComponent, {
      width: '300px',
      data: { name: '', parentName: '', parent_id: null, mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addParentNode(result);
      }
    });
  }

  addParentNode(data: NodeDialogData): void {
    const newNode: GroupNode = {
      name: data.name,
      parent_id: null,
      children: []
    };

    this.groupMappingService.addGroupMapping({ parent_id: null, group_name: data.name,user_id:this.userId, financial_year:this.financialYear }).subscribe(
      addedNode => {
        this.dataSource.push(addedNode);
        this.loadData(this.userId, this.financialYear);
      },
      error => {
        if (error.status === 404) {
          console.error('Group not found');
          this.snackBar.open('Group not found. Please ensure the group exists in the group list.', 'Close', {
            duration: 5000
          });
        } else {
          console.error('Error adding GroupMapping:', error);
          this.snackBar.open('An error occurred while adding the group mapping. Please try again.', 'Close', {
            duration: 5000
          });
        }
      }
    );
  }

  addNode(data: NodeDialogData): void {
    const newNode: GroupNode = {
      name: data.name,
      parent_id: this.selectedParentId,
      children: []
    };

    this.groupMappingService.addGroupMapping({ parent_id: this.selectedParentId, group_name: data.name,user_id:this.userId, financial_year:this.financialYear }).subscribe(
      addedNode => {
        if (addedNode.parent_id === null) {
          this.dataSource.push(addedNode);
        } else {
          this.addChildNode(this.dataSource, addedNode);
        }
        this.loadData(this.userId, this.financialYear);
      },
      error => {
        if (error.status === 404) {
          console.error('Group not found');
          this.snackBar.open('Group not found. Please ensure the group exists in the group list.', 'Close', {
            duration: 5000
          });
        } else {
          console.error('Error adding GroupMapping:', error);
          this.snackBar.open('An error occurred while adding the group mapping. Please try again.', 'Close', {
            duration: 5000
          });
        }
      }
    );

    this.selectedParentId = null;
  }

  addChildNode(nodes: GroupNode[], newNode: GroupNode): void {
    for (let node of nodes) {
      if (node.id === newNode.parent_id) {
        node.children = node.children || [];
        node.children.push(newNode);
        return;
      } else if (node.children) {
        this.addChildNode(node.children ?? [], newNode);
      }
    }
  }

  setParentNode(parentId: number): void {
    this.selectedParentId = parentId;
    const parentNode = this.findNodeById(this.dataSource, parentId);
    const parentName = parentNode ? parentNode.name : '';
    this.openDialog({ name: '', parentName, parent_id: parentId, mode: 'add' });
  }

  deleteNode(node: GroupNode): void {
    this.groupMappingService.deleteGroupMapping(node.id!).subscribe(() => {
      this.removeNode(this.dataSource, node.id!);
      this.loadData(this.userId, this.financialYear);
    });
  }

  removeNode(nodes: GroupNode[], nodeId: number): void {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        nodes.splice(i, 1);
        return;
      } else if (nodes[i].children) {
        this.removeNode(nodes[i].children ?? [], nodeId);
      }
    }
  }

  findNodeById(nodes: GroupNode[], nodeId: number | null | undefined): GroupNode | undefined {
    if (nodeId === null || nodeId === undefined) {
      return undefined;
    }
    for (let node of nodes) {
      if (node.id === nodeId) {
        return node;
      } else if (node.children) {
        const foundNode = this.findNodeById(node.children, nodeId);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return undefined;
  }
}
