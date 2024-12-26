import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupMappingTreeComponent } from './group-mapping-tree.component';

describe('GroupMappingTreeComponent', () => {
  let component: GroupMappingTreeComponent;
  let fixture: ComponentFixture<GroupMappingTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupMappingTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupMappingTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
