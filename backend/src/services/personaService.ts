import { db } from '../lib/firebase/admin';
import { PersonaData, CreatePersonaRequest, UpdatePersonaRequest } from '../types/persona';
import admin from 'firebase-admin';

export class PersonaService {
  private static collection = db.collection('personas');

  static async createPersona(userId: string, data: CreatePersonaRequest): Promise<PersonaData> {
    console.log('🔍 PersonaService.createPersona started');
    console.log('  - userId:', userId);
    console.log('  - data:', JSON.stringify(data, null, 2));
    
    const personaData = {
      name: data.name.trim(),
      description: data.description.trim(),
      characteristics: data.characteristics || [],
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log('  - personaData to save:', JSON.stringify(personaData, null, 2));

    const docRef = await this.collection.add(personaData);
    console.log('  - document created with ID:', docRef.id);
    
    const createdDoc = await docRef.get();
    console.log('  - retrieved document exists:', createdDoc.exists);
    console.log('  - retrieved document data:', JSON.stringify(createdDoc.data(), null, 2));
    
    const result = {
      id: docRef.id,
      ...createdDoc.data()
    } as PersonaData;
    
    console.log('  - returning result:', JSON.stringify(result, null, 2));
    return result;
  }

  static async getUserPersonas(userId: string): Promise<PersonaData[]> {
    console.log('🔍 PersonaService.getUserPersonas started');
    console.log('  - userId:', userId);
    
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    console.log('  - snapshot size:', snapshot.size);
    console.log('  - snapshot empty:', snapshot.empty);

    const personas = snapshot.docs.map(doc => {
      const data = {
        id: doc.id,
        ...doc.data()
      };
      console.log('  - found persona:', JSON.stringify(data, null, 2));
      return data;
    }) as PersonaData[];
    
    console.log('  - returning personas:', JSON.stringify(personas, null, 2));
    return personas;
  }

  static async getPersonaById(personaId: string): Promise<PersonaData | null> {
    const doc = await this.collection.doc(personaId).get();
    
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    } as PersonaData;
  }

  static async updatePersona(
    personaId: string, 
    userId: string, 
    data: UpdatePersonaRequest
  ): Promise<PersonaData> {
    const docRef = this.collection.doc(personaId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Persona not found');
    }

    const personaData = doc.data() as PersonaData;
    if (personaData.userId !== userId) {
      throw new Error('Access denied');
    }

    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();

    return {
      id: docRef.id,
      ...updatedDoc.data()
    } as PersonaData;
  }

  static async deletePersona(personaId: string, userId: string): Promise<void> {
    const docRef = this.collection.doc(personaId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Persona not found');
    }

    const personaData = doc.data() as PersonaData;
    if (personaData.userId !== userId) {
      throw new Error('Access denied');
    }

    await docRef.delete();
  }

  static async verifyOwnership(personaId: string, userId: string): Promise<boolean> {
    const persona = await this.getPersonaById(personaId);
    return persona?.userId === userId;
  }
} 