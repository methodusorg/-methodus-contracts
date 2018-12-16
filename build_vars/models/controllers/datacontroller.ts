import { MethodConfig, Method, Param, MethodResult, Body } from '@methodus/server';
import { Verbs } from '@methodus/server/src/rest';
import { Query as DataQuery } from '@methodus/data';

@MethodConfig('Data')
export class DataController {

    @Method(Verbs.Get, '/id/:id')
    public static async get(@Param('id') id: string): Promise<MethodResult<any>> {
        const repo = (this as any).methodus.repository;
        const item = await repo.get(id);
        return new MethodResult(item);
    }

    @Method(Verbs.Post, '/insert')
    public static async create(@Body('record') record: any): Promise<MethodResult<any>> {
        const repo = (this as any).methodus.repository;
        const item = await repo.insert(record);
        return new MethodResult(item);
    }

    @Method(Verbs.Post, '/id/:id')
    public static async update(@Param('id') id: string, @Body('record') record: any): Promise<MethodResult<any>> {
        const repo = (this as any).methodus.repository;
        const item = await repo.update({ _id: id }, record);
        return new MethodResult(item);
    }

    @Method(Verbs.Delete, '/id/:id')
    public static async delete(@Param('id') id: string): Promise<MethodResult<any>> {
        const repo = (this as any).methodus.repository;
        const item = await repo.delete({ _id: id });
        return new MethodResult(item);
    }

    @Method(Verbs.Post, '/query')
    public static async query(@Body('query') queryObject: any): Promise<MethodResult<any>> {
        const repo = (this as any).methodus.repository;
        const query = new DataQuery(repo.odm.collectionName);
        query.filter(queryObject);
        const item = await repo.query(query);
        return new MethodResult(item);
    }
}
