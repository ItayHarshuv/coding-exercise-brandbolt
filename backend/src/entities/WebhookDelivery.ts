import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WebhookSubscription } from './WebhookSubscription';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WebhookSubscription, (sub) => sub.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: WebhookSubscription;

  @Column()
  subscriptionId: number;

  @Column()
  orderId: number;

  @Column()
  event: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column()
  success: boolean;

  @Column({ default: 1 })
  attemptNumber: number;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
