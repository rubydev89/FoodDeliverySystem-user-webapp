import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeDetailComponent } from './charge-detail.component';

describe('ChargeDetailComponent', () => {
  let component: ChargeDetailComponent;
  let fixture: ComponentFixture<ChargeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChargeDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChargeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
