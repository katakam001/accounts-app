import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCopyComponent } from './account-copy.component';

describe('LedgerComponent', () => {
  let component: AccountCopyComponent;
  let fixture: ComponentFixture<AccountCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCopyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
