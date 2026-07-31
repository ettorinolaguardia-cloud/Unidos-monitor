import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // Import fondamentale
import { Repository } from 'typeorm';                 // Import fondamentale
import { Monitor } from './monitor.entity';          // Import della tua entità
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Injectable()
export class MonitorsService {
  // Qui "iniettiamo" il repository per parlare col database
  constructor(
    @InjectRepository(Monitor)
    private monitorsRepository: Repository<Monitor>,
  ) {}

  create(createMonitorDto: CreateMonitorDto) {
    // Salviamo il nuovo monitor nel database
    return this.monitorsRepository.save(createMonitorDto);
  }

  findAll() {
    // Leggiamo tutti i record dal database
    return this.monitorsRepository.find();
  }

  findOne(id: number) {
    // Cerchiamo un singolo monitor per ID
    return this.monitorsRepository.findOneBy({ id });
  }

  update(id: number, updateMonitorDto: UpdateMonitorDto) {
    // Aggiorniamo il monitor
    return this.monitorsRepository.update(id, updateMonitorDto);
  }

  remove(id: number) {
    // Eliminiamo il monitor
    return this.monitorsRepository.delete(id);
  }
}