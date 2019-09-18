import { ElasticsearchService } from "@nestjs/elasticsearch";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SearchService {
    constructor(public readonly backend: ElasticsearchService) {
    }
}
