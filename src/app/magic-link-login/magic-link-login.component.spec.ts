import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicLinkLoginComponent } from './magic-link-login.component';

describe('MagicLinkLoginComponent', () => {
  let component: MagicLinkLoginComponent;
  let fixture: ComponentFixture<MagicLinkLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicLinkLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MagicLinkLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
